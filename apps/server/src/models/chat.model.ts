import { db } from '../utils/database';
import { ChatInfo } from '@repo/common';

export class ChatModel {

  static async saveChat(chat: ChatInfo): Promise<boolean> {
    try {
      await db.query(
        `INSERT INTO ai_chat (session_id, user_id, title, question, answer) VALUES (?, ?, ?, ?, ?)`,
        [chat.session_id, chat.user_id, chat.title, chat.question, chat.answer]
      );
      return true;
    } catch (error) {
      console.error('Error saving chat:', error);
      throw error;
    }
  }
 
  static async getChatHistory(userId: number) {
    try {
      const result = await db.query<ChatInfo>(
        `SELECT * FROM ai_chat WHERE user_id = ? ORDER BY created_at ASC`,
        [userId]
      );
      console.log("result", result);
      return result;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }


}
