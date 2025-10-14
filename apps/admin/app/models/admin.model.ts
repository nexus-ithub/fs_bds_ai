import { Admin } from "@repo/common";
import { db } from "../utils/db";
import { RowDataPacket } from "mysql2";

export class AdminModel {
  static async findAll(): Promise<Admin[] | null> {
    try {
      const users = await db.query<(RowDataPacket & Admin)[]>(
        'SELECT id, name, email, phone, admin_type as adminType, created_at as createdAt FROM admins'
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

  
}