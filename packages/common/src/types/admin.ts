export type Menu = "dashboard" | "admin" | "users" | "board" | "faq" | "category" | "bds" | "youtube" | "agent" | "question" | "session";

export interface Admin {
  id?: string;
  email: string;
  name: string;
  password: string;
  phone?: string;
  adminType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: number;
  icon: string;
  question: string;
  seq?: number | null;
  selectedYn: 'Y' | 'N';
  deleteYn: 'Y' | 'N';
  createdAt: Date;
}

export interface Agent {
  agentName: string;
  nameDesc: string;
  newchatLabel: string;
  chatTitle: string;
  chatSubtitle: string;
  placeholder: string;
  warningMsg: string;
  questions: Question[];
  // selectedQuestions: {id: number, seq: number}[];
}