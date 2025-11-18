import { Admin } from "@repo/common";
import { db } from "../utils/db";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcryptjs";

export class AdminModel {
  static async findAll(keyword: string, page: number, size: number): Promise<{ users: Admin[]; totalCount: number } | null> {
    try {
      const users = await db.query<(RowDataPacket & Admin)[]>(
        `SELECT 
          id, name, email, phone, admin_type as adminType, created_at as createdAt 
        FROM admins 
        WHERE delete_yn = "N" AND (name LIKE ? OR email LIKE ?) 
        ORDER BY created_at DESC 
        LIMIT ? 
        OFFSET ?`,
        [`%${keyword}%`, `%${keyword}%`, size, (page - 1) * size]
      );
      const countRows = await db.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM admins WHERE delete_yn = "N" AND (name LIKE ? OR email LIKE ?)`,
        [`%${keyword}%`, `%${keyword}%`]
      );
      const totalCount = (countRows?.[0] as { count: number })?.count ?? 0;
      return { users, totalCount };
    } catch (error) {
      console.error('Error finding user:', error);
      throw error; 
    }
  }

  static async register(email: string, password: string, name: string, phone: string, adminType: string): Promise<boolean> {
    try {
      const users = await db.query<(RowDataPacket & Admin)[]>(
        'INSERT INTO admins (email, password, name, phone, admin_type) VALUES (?, ?, ?, ?, ?)',
        [email, password, name, phone, adminType]
      );
      return true;
    } catch (error) {
      console.error('Error registering user:', error);
      return false; 
    }
  } 

  static async update(id: string, email: string, name: string, phone: string, adminType: string): Promise<boolean> {
    try {
      const users = await db.query<(RowDataPacket & Admin)[]>(
        'UPDATE admins SET email = ?, name = ?, phone = ?, admin_type = ? WHERE id = ?',
        [email, name, phone, adminType, id]
      );
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false; 
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const users = await db.query<(RowDataPacket & Admin)[]>(
        'UPDATE admins SET email = null, password = null, name = null, phone = null, admin_type = null, delete_yn = ? WHERE id = ?',
        ["Y", id]
      );
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false; 
    }
  }

  static async confirmPassword(id: string, password: string) {
    try {
      const user = await db.query<(RowDataPacket & Admin)[]>(
        'SELECT password FROM admins WHERE id = ? AND delete_yn = "N"',
        [id]
      );
      console.log(user?.[0]?.password)
      return bcrypt.compareSync(String(password), user?.[0]?.password ?? "");
    } catch (error) {
      console.error('Error comparing password:', error);
      throw error;
    }
  }

  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      const users = await db.query<(RowDataPacket & Admin)[]>(
        'UPDATE admins SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      return true;
    } catch (error) {
      console.error('Error updating user password:', error);
      return false; 
    }
  }

  static async resetPassword(email: string, password: string): Promise<boolean> {
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const users = await db.query<(RowDataPacket & Admin)[]>(
        'UPDATE admins SET password = ? WHERE email = ?',
        [hashedPassword, email]
      );
      return true;
    } catch (error) {
      console.error('Error updating user password:', error);
      return false; 
    }
  }
}