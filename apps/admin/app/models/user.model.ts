import { Admin, ConsultRequest, User, AGES, INTERESTS } from "@repo/common";
import { db } from "../utils/db";
import { RowDataPacket } from "mysql2";
import { trackError } from "../utils/analytics";

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
      trackError(error,{
        message: "사용자 목록 개수 조회 중 오류가 발생했습니다.",
        file: "user.model.ts",
        function: "getTotalUser",
        severity: "error"
      })
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
      trackError(err,{
        message: "사용자 목록 조회 중 오류가 발생했습니다.",
        file: "user.model.ts",
        function: "getList",
        severity: "error"
      })
      throw err;
    }      
  }

  static async genderCount(): Promise<{name: string, value: number}[]> {
    try {
      const rows = await db.query<({ gender: string, value: number } & RowDataPacket)[]>(
        'SELECT gender, COUNT(*) as value FROM users_info WHERE delete_yn="N" GROUP BY gender'
      );

      return rows.map(row => ({
        name: row.gender === 'M' ? '남성' : '여성',
        value: Number(row.value)
      }));
    } catch (error) {
      console.error('Error getting gender count:', error);
      trackError(error,{
        message: "사용자 성별 통계 조회 중 오류가 발생했습니다.",
        file: "user.model.ts",
        function: "genderCount",
        severity: "error"
      })
      throw error;
    }
  }

  static async ageCount(): Promise<{name: string, value: number}[]> {
    try {
      const rows = await db.query<({ age: number, value: number } & RowDataPacket)[]>(
        'SELECT age, COUNT(*) as value FROM users_info WHERE delete_yn="N" GROUP BY age'
      );

      return rows.map(row => {
        const ageInfo = AGES.find(a => a.id === row.age);
        return {
          name: ageInfo?.label || '알 수 없음',
          value: Number(row.value)
        };
      });
    } catch (error) {
      console.error('Error getting age count:', error);
      trackError(error,{
        message: "사용자 연령 통계 조회 중 오류가 발생했습니다.",
        file: "user.model.ts",
        function: "ageCount",
        severity: "error"
      })
      throw error;
    }
  }

  static async interestCount(): Promise<{name: string, value: number}[]> {
    try {
      const rows = await db.query<({ item_id: string, value: number } & RowDataPacket)[]>(
        'SELECT item_id, COUNT(*) as value FROM users_info_multi WHERE delete_yn="N" AND item_type="INTEREST" GROUP BY item_id'
      );

      return rows.map(row => {
        const interestInfo = INTERESTS.find(i => i.id === Number(row.item_id));
        return {
          name: interestInfo?.label || '알 수 없음',
          value: Number(row.value)
        };
      });
    } catch (error) {
      console.error('Error getting interest count:', error);
      trackError(error,{
        message: "사용자 관심분야 통계 조회 중 오류가 발생했습니다.",
        file: "user.model.ts",
        function: "interestCount",
        severity: "error"
      })
      throw error;
    }
  }
}