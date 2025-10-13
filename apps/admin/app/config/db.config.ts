import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface DatabaseConfig {
  mysql: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  // bds: {
  //   sshHost: string;
  //   sshPort: number;
  //   sshUser: string;
  //   sshPassword: string;
  //   host: string;
  //   port: number;
  //   user: string;
  //   password: string;
  //   database: string;
  // };
}

// Validate required environment variables
const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  // 'BDS_USERNAME',
  // 'BDS_HOST',
  // 'BDS_PORT',
  // 'BDS_PASSWORD',
  // 'BDS_DB_HOST',
  // 'BDS_DB_PORT',
  // 'BDS_DB_USER',
  // 'BDS_DB_PASSWORD',
  // 'BDS_DB_NAME'
];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export const dbConfig: DatabaseConfig = {
  mysql: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!
  },
  // bds: {
  //   sshHost: process.env.BDS_HOST!,
  //   sshPort: parseInt(process.env.BDS_PORT!, 10),
  //   sshUser: process.env.BDS_USERNAME!,
  //   sshPassword: process.env.BDS_PASSWORD!,
  //   host: process.env.BDS_DB_HOST!,
  //   port: parseInt(process.env.BDS_DB_PORT!, 10),
  //   user: process.env.BDS_DB_USER!,
  //   password: process.env.BDS_DB_PASSWORD!,
  //   database: process.env.BDS_DB_NAME!
  // }
};