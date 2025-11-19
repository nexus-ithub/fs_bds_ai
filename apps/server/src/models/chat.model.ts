import { db } from '../utils/database';
import { ChatInfo } from '@repo/common';

export class ChatModel {

  static async saveChat(chat: ChatInfo): Promise<boolean> {
    try {
      await db.query(
        `INSERT INTO ai_chat (session_id, user_id, title, question, answer, score) VALUES (?, ?, ?, ?, ?, ?)`,
        [chat.session_id, chat.user_id, chat.title, chat.question, chat.answer, chat.score]
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
      return result;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  static async updateTitle(sessionId: string, title: string, userId: number): Promise<boolean> {
    try {
      await db.query(
        `UPDATE ai_chat SET title = ? WHERE session_id = ? AND user_id = ? AND title IS NOT NULL`,
        [title, sessionId, userId]
      );
      return true;
    } catch (error) {
      console.error('Error updating chat title:', error);
      throw error;
    }
  }

  static async deleteChat(sessionId: string, userId: number): Promise<boolean> {
    try {
      await db.query(
        `UPDATE ai_chat SET delete_yn = 'Y' WHERE session_id = ? AND user_id = ?`,
        [sessionId, userId]
      );
      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }
}
