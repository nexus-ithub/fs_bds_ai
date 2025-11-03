import { Admin } from "@repo/common";
import { db } from "../utils/db";
import { RowDataPacket } from "mysql2";

export class AdminModel {
  static async findAll(keyword: string): Promise<Admin[] | null> {
    try {
      const users = await db.query<(RowDataPacket & Admin)[]>(
        'SELECT id, name, email, phone, admin_type as adminType, created_at as createdAt FROM admins WHERE delete_yn = "N" AND (name LIKE ? OR email LIKE ?)',
        [`%${keyword}%`, `%${keyword}%`]
      );
      return users || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
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
      console.error('Error finding user by email:', error);
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
      console.error('Error finding user by email:', error);
      return false; 
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const users = await db.query<(RowDataPacket & Admin)[]>(
        'UPDATE admins SET delete_yn = ? WHERE id = ?',
        ["Y", id]
      );
      return true;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return false; 
    }
  }
}