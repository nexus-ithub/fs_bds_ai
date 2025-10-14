import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
    };
    accessToken?: string; // 클라이언트에 보내는 토큰
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    accessToken?: string;
    refreshToken?: string; // 서버에서만 사용
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    accessToken?: string;
    refreshToken?: string; // 서버에서만 사용
    accessTokenExpires?: number;
  }
}