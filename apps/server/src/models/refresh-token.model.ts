import { db } from '../utils/database';
import { RowDataPacket } from 'mysql2';

export interface RefreshToken extends RowDataPacket {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  delete_yn: 'Y' | 'N';
}

export class RefreshTokenModel {
  static async create(userId: number, token: string, expiresAt: Date): Promise<void> {
    try {
      await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt]
      );
    } catch (error) {
      console.error('Error creating refresh token:', error);
      throw error;
    }
  }

  static async findByToken(token: string): Promise<RefreshToken | null> {
    try {
      const tokens = await db.query<RefreshToken>(
        'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW() AND delete_yn = ?',
        [token, 'N']
      );
      return tokens[0] || null;
    } catch (error) {
      console.error('Error finding refresh token:', error);
      throw error;
    }
  }

  static async deleteByUserId(userId: number): Promise<void> {
    try {
      await db.query(
        'UPDATE refresh_tokens SET delete_yn = ? WHERE user_id = ? AND delete_yn = ?',
        ['Y', userId, 'N']
      );
    } catch (error) {
      console.error('Error soft deleting refresh tokens:', error);
      throw error;
    }
  }

  static async deleteByToken(token: string): Promise<void> {
    try {
      await db.query(
        'UPDATE refresh_tokens SET delete_yn = ? WHERE token = ? AND delete_yn = ?',
        ['Y', token, 'N']
      );
    } catch (error) {
      console.error('Error soft deleting refresh token:', error);
      throw error;
    }
  }
}
