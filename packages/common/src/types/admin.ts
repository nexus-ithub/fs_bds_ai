export type Menu = "dashboard" | "admin" | "users" | "board" | "faq" | "category" | "bds" | "youtube" | "agent" | "question" | "session";

export interface Admin {
  id: string;
  email: string;
  name: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}