import { db } from '../utils/database';
import { RowDataPacket } from 'mysql2';

export interface User extends RowDataPacket {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  profile?: string;
  provider?: string;
  delete_yn?: string;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const users = await db.query<User>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error; 
    }
  }

  static async findById(id: number): Promise<User | null> {
    try {
      const users = await db.query<User>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async userInfoById(id: number): Promise<User | null> {
    try {
      const users = await db.query<User>(
        'SELECT id, email, name, phone, profile FROM users WHERE id = ?',
        [id]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }  

  static async create (user: User): Promise<User> {
    try {
      const [result] = await db.query<User>(
        `
        INSERT INTO users (email, password, name, phone, profile, provider)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          password = VALUES(password),
          name = VALUES(name),
          phone = VALUES(phone),
          profile = VALUES(profile),
          provider = VALUES(provider)
        `,
        [user.email, user.password, user.name, user.phone, user.profile, user.provider]
      );
      return result;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // static async update (user: User): Promise<User> {
  //   console.log('user:', user);
  //   try {
  //     const [result] = await db.query<User>(
  //       'UPDATE users SET password = ?, name = ?, phone = ?, profile = ?, provider = ? WHERE id = ?',
  //       [user.password, user.name, user.phone, user.profile, user.provider, user.id]
  //     );
  //     return result;
  //   } catch (error) {
  //     console.error('Error updating user:', error);
  //     throw error;
  //   }
  // }
}
