export interface ChatInfo {
  id?: number;
  session_id: string;
  user_id: number;
  title?: string;
  question: string;
  answer: string;
  score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SessionList {
  sessionId: string;
  email?: string;
  sessionStart: string;
  sessionEnd: string;
  questionCount: number;
  deleteYn: 'Y' | 'N';
}