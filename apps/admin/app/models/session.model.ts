import { db } from "../utils/db";

export class SessionModel {
  static async getList(page: number, size: number) {
    try {
      const result = await db.query(`
        SELECT 
          a.session_id as sessionId, 
          u.email, 
          MIN(a.created_at) as sessionStart, 
          MAX(a.created_at) as sessionEnd, 
          COUNT(*) as questionCount, 
          a.delete_yn as deleteYn 
        FROM ai_chat a 
        LEFT JOIN users u ON a.user_id = u.id 
        GROUP BY a.session_id 
        ORDER BY sessionStart DESC
        LIMIT ? 
        OFFSET ?
      `,[size, (page - 1) * size]);
      const total = await db.query(`SELECT COUNT(DISTINCT session_id) as totalCount FROM ai_chat`);
      return {total: parseInt(total![0]!.totalCount), data: result};
    } catch (error) {
      console.error('SessionModel.getList error:', error);
      throw error;
    }
  }

  static async getChatContent(sessionId: string) {
    try {
      const result = await db.query(`
        SELECT * FROM ai_chat 
        WHERE session_id = ?
        ORDER BY created_at ASC
      `,[sessionId]);
      return result;
    } catch (error) {
      console.error('SessionModel.getChatContent error:', error);
      throw error;
    }
  }
}
