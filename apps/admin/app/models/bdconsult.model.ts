import { type BdConsultRequest } from "@repo/common";
import { db } from "../utils/db";
import { RowDataPacket } from "mysql2";

export class BdConsultRequestModel {
  static async getTotalBdConsultRequest(): Promise<number> {
    try {
      const rows = await db.query<({ total: number } & RowDataPacket)[]>(
        'SELECT COUNT(*) as total FROM bds_consult_request WHERE delete_yn = "N"'
      );
      const total = Array.isArray(rows) && rows.length > 0 ? rows[0]?.total ?? 0 : 0;
      return total;
    } catch (error) {
      console.error('Error getting total consult request:', error);
      throw error;
    }
  }

  static async getList(page: number, size: number): Promise<{total: number, response: BdConsultRequest[]}> {
    try {
      const total = await this.getTotalBdConsultRequest();
      const response = await db.query<(BdConsultRequest & RowDataPacket)[]>(
        `SELECT 
          cr.key as id,
          cr.bd_id as bdId,
          cr.user_id as userId,
          cr.name as name,
          cr.phone as phone,
          cr.content as content,
          cr.created_at as createdAt
        FROM bds_consult_request as cr
        WHERE cr.delete_yn = 'N' 
        ORDER BY cr.created_at DESC
        LIMIT ? OFFSET ?`,
        [size, (page - 1) * size]
      );
      return {total, response};
    } catch (err : any) {
      console.error('Error getting bd consult request list:', err);
      throw err;
    }      
  }
}