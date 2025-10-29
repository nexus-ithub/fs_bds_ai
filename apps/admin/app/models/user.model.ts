import { Admin, ConsultRequest, User } from "@repo/common";
import { db } from "../utils/db";
import { RowDataPacket } from "mysql2";

export class UserModel {
  static async getTotalUser(): Promise<number> {
    try {
      const rows = await db.query<({ total: number } & RowDataPacket)[]>(
        'SELECT COUNT(*) as total FROM users WHERE delete_yn = "N"'
      );
      const total = Array.isArray(rows) && rows.length > 0 ? rows[0]?.total ?? 0 : 0;
      return total;
    } catch (error) {
      console.error('Error getting total consult request:', error);
      throw error;
    }
  }

  static async getList(page: number, size: number, searchName?: string): Promise<{total: number, response: User[]}> {
    try {
      const total = await this.getTotalUser();
      const response = await db.query<(User & RowDataPacket)[]>(
        `SELECT 
          u.id as id,
          u.name as name,
          u.email as email,
          u.phone as phone,
          u.provider as provider,
          u.created_at as createdAt
        FROM users as u
        WHERE u.delete_yn = 'N' 
        ${searchName ? `AND u.name LIKE '%${searchName}%'` : ''}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?`,
        [size, (page - 1) * size]
      );
      return {total, response};
    } catch (err : any) {
      console.error('Error getting consult request list:', err);
      throw err;
    }      
  }
}