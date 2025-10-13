import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { dbConfig } from '../config/db.config';
import { RowDataPacket } from 'mysql2';

class Database {
  private static instance: Database;
  private pool: Pool | null = null;

  private constructor() {
    this.pool = mysql.createPool({
      ...dbConfig.mysql,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // public async connect(): Promise<void> {
  //   try {
  //     console.log('🔥Connecting to database...');
  //     // Create MySQL Pool
  //     this.pool = mysql.createPool({
  //       ...dbConfig.mysql,
  //       waitForConnections: true,
  //       connectionLimit: 10,
  //       queueLimit: 0,
  //     });

  //     // Test the connection
  //     await this.pool.getConnection();
  //     console.log('🔥Database connection established');
  //   } catch (error) {
  //     console.error('🔥Failed to connect to database:', error);
  //     throw error;
  //   }
  // }

  public async getConnection(): Promise<PoolConnection> {
    if (!this.pool) {
      throw new Error('🔥Database pool not initialized');
    }
    return await this.pool.getConnection();
  }

  public async query<T extends RowDataPacket[]>(
    sql: string, 
    values?: any[]
  ): Promise<T> {
    if (!this.pool) throw new Error('🔥Database pool not initialized');
    
    try {
      const [results] = await this.pool.query<T>(sql, values);
      return results;
    } catch (error) {
      console.error('🔥Database query error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    console.log('🔥Database connection closed');
  }
}

export const db = Database.getInstance();
