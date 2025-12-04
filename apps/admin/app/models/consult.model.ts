import { ConsultRequest } from "@repo/common";
import { db } from "../utils/db";
import { RowDataPacket } from "mysql2";
import { trackError } from "../utils/analytics";

export class ConsultRequestModel {
  static async getTotalConsultRequest(): Promise<number> {
    try {
      const rows = await db.query<({ total: number } & RowDataPacket)[]>(
        'SELECT COUNT(*) as total FROM consult_request WHERE delete_yn = "N"'
      );
      const total = Array.isArray(rows) && rows.length > 0 ? rows[0]?.total ?? 0 : 0;
      return total;
    } catch (error) {
      console.error('Error getting total consult request:', error);
      trackError(error,{
        message: "설계상담 요청 목록 개수 조회 중 오류가 발생했습니다.",
        file: "consult.model.ts",
        function: "getTotalConsultRequest",
        severity: "error"
      })
      throw error;
    }
  }

  static async getList(page: number, size: number): Promise<{total: number, response: ConsultRequest[]}> {
    try {
      const total = await this.getTotalConsultRequest();
      const response = await db.query<(ConsultRequest & RowDataPacket)[]>(
        `SELECT 
          cr.key as id,
          cr.land_id as landId,
          cr.content as content,
          cr.consulted_yn as consultedYn,
          cr.created_at as createdAt,
          cr.updated_at as updatedAt,
          cr.user_id as userId,
          JSON_OBJECT(
            'name', u.name,
            'email', u.email,
            'phone', u.phone
          ) as user,
          JSON_OBJECT(
            'id', l.id,
            'legDongCode', l.leg_dong_code,
            'legDongName', l.leg_dong_name,
            'jibun', l.jibun
          ) as land
        FROM consult_request as cr
        LEFT JOIN users as u ON cr.user_id = u.id
        LEFT JOIN address_polygon as l ON cr.land_id = l.id
        WHERE cr.delete_yn = 'N' 
        ORDER BY cr.created_at DESC
        LIMIT ? OFFSET ?`,
        [size, (page - 1) * size]
      );
      for(const item of response) {
        item.user = JSON.parse(item.user as any);
        item.land = JSON.parse(item.land as any);
      }
      return {total, response};
    } catch (err : any) {
      console.error('Error getting consult request list:', err);
      trackError(err,{
        message: "설계상담 요청 목록 조회 중 오류가 발생했습니다.",
        file: "consult.model.ts",
        function: "getList",
        severity: "error"
      })
      throw err;
    }      
  }

  static async updatePending(ids: string[]) {
    try {
      if (ids.length === 0) return;
      const keyIds = ids.map(() => '?').join(',');

      await db.query(`UPDATE consult_request SET consulted_yn = 'N' WHERE \`key\` IN (${keyIds});`, ids)

      return true;
    } catch (err) {
      console.error("Error updating consult pending: ", err)
      trackError(err,{
        message: "설계상담 대기 상태 변경 중 오류가 발생했습니다.",
        file: "consult.model.ts",
        function: "updatePending",
        severity: "error"
      })
      throw err;
    }
  }

  static async updateComplete(ids: string[]) {
    try {
      if (ids.length === 0) return;
      const keyIds = ids.map(() => '?').join(',');

      await db.query(`UPDATE consult_request SET consulted_yn = 'Y' WHERE \`key\` IN (${keyIds});`, ids)
      
      return true;
    } catch (err) {
      console.error("Error updating consult complete: ", err)
      trackError(err,{
        message: "설계상담 완료 상태 변경 중 오류가 발생했습니다.",
        file: "consult.model.ts",
        function: "updateComplete",
        severity: "error"
      })
      throw err;
    }
  }

  static async updateDelete(ids: string[]) {
    try {
      if (ids.length === 0) return;
      const keyIds = ids.map(() => '?').join(',');

      await db.query(`UPDATE consult_request SET delete_yn = 'Y' WHERE \`key\` IN (${keyIds});`, ids)
      
      return true;
    } catch (err) {
      console.error("Error updating consult delete: ", err)
      trackError(err,{
        message: "설계상담 삭제 중 오류가 발생했습니다.",
        file: "consult.model.ts",
        function: "updateDelete",
        severity: "error"
      })
      throw err;
    }
  }

}