import fs from 'fs';
import net, { Server as NetServer, Socket } from 'net';
import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import { Client as SshClient, ClientChannel } from 'ssh2';
import { dbConfig } from '../config/db.config';

type TunnelServer = NetServer;

async function createSshTunnel(options: {
  host: string; // SSH host
  port: number; // SSH port
  username: string;
  password?: string;
  privateKey?: Buffer | string;
  passphrase?: string;
  dstHost: string; // DB host as seen from SSH server
  dstPort: number; // DB port as seen from SSH server
  localHost?: string; // default 127.0.0.1
  localPort?: number; // 0 for random
  readyTimeout?: number;
  keepAlive?: boolean;
}): Promise<{ server: TunnelServer; localPort: number; ssh: SshClient }> {
  return new Promise((resolve, reject) => {
    const ssh = new SshClient();

    const localHost = options.localHost ?? '127.0.0.1';
    const localPort = options.localPort ?? 0;

    // Create a local TCP server that forwards connections via SSH
    const server = net.createServer((socket: Socket) => {
      ssh.forwardOut(
        '127.0.0.1',
        socket.localPort || 0,
        options.dstHost,
        options.dstPort,
        (err: Error | undefined, stream: ClientChannel) => {
          if (err) {
            socket.destroy();
            return;
          }
          socket.pipe(stream).pipe(socket);
        }
      );
    });

    server.on('error', (err) => reject(err));

    ssh
      .on('ready', () => {
        server.listen(localPort, localHost, () => {
          const address = server.address();
          const boundPort = typeof address === 'string' ? parseInt(address.split(':').pop() || '0', 10) : address?.port || 0;
          if (!boundPort) {
            reject(new Error('Failed to determine local forwarded port'));
            return;
          }
          resolve({ server, localPort: boundPort, ssh });
        });
      })
      .on('error', (err) => reject(err))
      .connect({
        host: options.host,
        port: options.port,
        username: options.username,
        password: options.password,
        privateKey: options.privateKey,
        passphrase: options.passphrase,
        readyTimeout: options.readyTimeout ?? 20000,
        keepaliveInterval: options.keepAlive ? 10000 : undefined,
      } as any);
  });
}

class Database {
  private static instance: Database;
  private pool: Pool | null = null;
  private sshServer: TunnelServer | null = null;
  private sshClient: SshClient | null = null;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) Database.instance = new Database();
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.pool) return;

    // console.log('Connecting to BDS DB via SSH tunnel...', dbConfig.bds);

    const sshOpts = {
      host: dbConfig.bds.sshHost,
      port: dbConfig.bds.sshPort ?? 22,
      username: dbConfig.bds.sshUser,
      // Choose one auth method
      password: dbConfig.bds.sshPassword,
      // privateKey: fs.readFileSync('~/.ssh/id_rsa'),
      // passphrase: undefined,

      // Remote DB as seen from SSH host
      dstHost: dbConfig.bds.host || '127.0.0.1',
      dstPort: dbConfig.bds.port ?? 3306,

      // Local bind
      localHost: '127.0.0.1',
      localPort: 0,

      readyTimeout: 20000,
      keepAlive: true,
    } as const;

    try {
      const { server, localPort, ssh } = await createSshTunnel(sshOpts);
      this.sshServer = server;
      this.sshClient = ssh;

      console.log(`SSH tunnel ready: 127.0.0.1:${localPort} -> ${sshOpts.dstHost}:${sshOpts.dstPort}`);

      this.pool = mysql.createPool({
        host: '127.0.0.1',
        port: localPort,
        user: dbConfig.bds.user,
        password: dbConfig.bds.password,
        database: dbConfig.bds.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 15000,
      });

      const conn = await this.pool.getConnection();
      const [rows] = await conn.query('SELECT 1 AS ok');
      conn.release();
      console.log('DB connected OK:', rows);
    } catch (err) {
      console.error('Failed to connect via SSH tunnel:', err);
      await this.disconnect();
      throw err;
    }
  }

  public async getConnection(): Promise<PoolConnection> {
    if (!this.pool) throw new Error('BDS database not connected');
    return this.pool.getConnection();
  }

  public async query<T = RowDataPacket[]>(sql: string, values?: any[]): Promise<T[]> {
    if (!this.pool) throw new Error('BDS database not connected');
    const [rows] = await this.pool.query(sql, values);
    return rows as T[];
  }

  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    if (this.sshServer) {
      await new Promise<void>((resolve) => this.sshServer!.close(() => resolve()));
      this.sshServer = null;
    }
    if (this.sshClient) {
      this.sshClient.end();
      this.sshClient = null;
    }
    console.log('BDS DB + SSH tunnel closed');
  }
}

export const bdsDb = Database.getInstance();
