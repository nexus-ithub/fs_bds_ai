import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import type { User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { AuthModel } from "../../../models/auth.model";
import { generateAccessToken, generateRefreshToken, refreshAccessToken } from "../../../utils/token";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await AuthModel.findByEmail(credentials!.email);
        if (!user) throw new Error("Invalid credentials");
        const valid = await bcrypt.compare(credentials!.password, user.password);
        if (!valid) throw new Error("Invalid credentials");

        const accessToken = generateAccessToken({ id: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email });
        const expiresAt = new Date(Date.now() + Number(process.env.REFRESH_TOKEN_EXPIRES_IN || 604800) * 1000);
        await AuthModel.updateRefreshToken(user.id!, refreshToken, expiresAt);

        return {
          id: user.id!,
          email: user.email,
          name: user.name,
          accessToken,
          refreshToken,
        };
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: User }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = Date.now() + 5 * 60 * 1000; // 5분
      } else if (Date.now() > token.accessTokenExpires!) {
        // accessToken 만료 → refresh
        const refreshed = await refreshAccessToken(token);
        if (refreshed.error) {
          return { ...token, error: "RefreshAccessTokenError" };
        }
        return refreshed;
      }
      return token;
    },

    async session({ session, token }: { session: any; token: JWT }) {
      session.user = { id: token.id, email: token.email, name: token.name };
      session.accessToken = token.accessToken; // 클라이언트는 accessToken만 확인
      return session;
    },
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
