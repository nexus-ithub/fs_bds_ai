import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { AuthModel } from "../../../models/auth.model";
import { generateAccessToken, generateRefreshToken, refreshAccessToken } from "../../../utils/token";

const options: NextAuthOptions = {
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
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = Date.now() + Number(process.env.ACCESS_TOKEN_EXPIRES_IN || 300) * 1000;
      } else if (Date.now() > token.accessTokenExpires!) {
        const refreshed = await refreshAccessToken(token);
        if (refreshed.error) {
          return { ...token, error: "RefreshAccessTokenError" };
        }
        return refreshed;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = { id: token.id, email: token.email, name: token.name };
      session.accessToken = token.accessToken;
      session.error = token.error as string | undefined;
      return session;
    },
  },
};

const handler = NextAuth(options);

export const GET = handler as unknown as (req: Request) => Promise<Response>;
export const POST = handler as unknown as (req: Request) => Promise<Response>;
