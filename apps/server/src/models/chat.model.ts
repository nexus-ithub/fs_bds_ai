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
 


}
