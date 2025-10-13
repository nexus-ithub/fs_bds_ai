import { Admin } from "@repo/common";
import { db } from "../utils/db";
import { RowDataPacket } from "mysql2";

export class AdminModel {
  static async findByEmail(email: string): Promise<Admin | null> {
    try {
      const users = await db.query<(RowDataPacket & Admin)[]>(
        'SELECT * FROM admins WHERE email = ?',
        [email]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error; 
    }
  } 

}