export interface ChatInfo {
  id?: number;
  session_id: string;
  user_id: number;
  title?: string;
  question: string;
  answer: string;
  created_at?: string;
  updated_at?: string;
}