import { db } from '../utils/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';

export interface User extends RowDataPacket {
  id?: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  profile?: string;
  provider?: string;
  marketingEmail?: string;
  marketingSms?: string;
  deleteYn?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const users = await db.query<User>(
        'SELECT * FROM users WHERE email = ? ',
        [email]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error; 
    }
  }

  static async checkEmail(email: string): Promise<boolean> {
    try {
      const users = await db.query<User>(
        'SELECT * FROM users WHERE email = ? ',
        [email]
      );
      return users[0] ? true : false;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error; 
    }
  }

  static async findById(id: number): Promise<User | null> {
    try {
      const users = await db.query<User>(
        'SELECT * FROM users WHERE id = ? AND delete_yn = "N"',
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
        'SELECT id, email, name, phone, profile FROM users WHERE id = ? AND delete_yn = "N"',
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
      const salt = bcrypt.genSaltSync(8);
      const hashedPassword = bcrypt.hashSync(String(user.password), salt);
      const result = await db.query(
        `
        INSERT INTO users (email, password, name, phone, profile, provider, marketing_email, marketing_sms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          password = VALUES(password),
          name = VALUES(name),
          phone = VALUES(phone),
          profile = VALUES(profile),
          provider = VALUES(provider),
          marketing_email = VALUES(marketing_email),
          marketing_sms = VALUES(marketing_sms)
        `,
        [user.email, hashedPassword, user.name, user.phone, user.profile, user.provider, user.marketingEmail, user.marketingSms]
      );

      const newUser: User = {
        ...user,
        id: (result as any).insertId,
      };
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async update (user: User): Promise<void> {
    console.log('user:', user);
    try {
      await db.query<User>(
        'UPDATE users SET password = ?, name = ?, phone = ?, profile = ?, provider = ? WHERE id = ? AND delete_yn = "N"',
        [user.password, user.name, user.phone, user.profile, user.provider, user.id]
      );
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async updatePassword (id: number, password: string): Promise<void> {
    const salt = bcrypt.genSaltSync(8);
    const hashedPassword = bcrypt.hashSync(String(password), salt);
    try {
      await db.query<User>(
        'UPDATE users SET password = ? WHERE id = ? AND delete_yn = "N"',
        [hashedPassword, id]
      );
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async confirmPassword (id: number, password: string): Promise<boolean> {
    try {
      const user = await UserModel.findById(id);
      if (!user) {
        return false;
      }
      return bcrypt.compareSync(String(password), user.password);
    } catch (error) {
      console.error('Error comparing password:', error);
      throw error;
    }
  }
}
