// utils/token.ts
import jwt from "jsonwebtoken";
import { AuthModel } from "../models/auth.model";

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;
const ACCESS_TOKEN_EXPIRES_IN = Number(process.env.ACCESS_TOKEN_EXPIRES_IN || "300");
const REFRESH_TOKEN_EXPIRES_IN = Number(process.env.REFRESH_TOKEN_EXPIRES_IN || "604800");

export const generateAccessToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

export const generateRefreshToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err: any) {
    console.error("verifyToken error:", err?.name, err?.message);
    if (!JWT_SECRET) console.error("verifyToken warning: NEXTAUTH_SECRET is undefined at runtime");
    return null;
  }
};

export function handleAuth(req: Request) {
  const rawHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = rawHeader?.startsWith("Bearer ") ? rawHeader.split(" ")[1] : null;
  
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return decoded;
}

export async function refreshAccessToken(token: any) {

  try {
    if (!token.refreshToken) throw new Error("No refresh token");

    const decoded: any = verifyToken(token.refreshToken);
    if (!decoded) throw new Error("Invalid refresh token");

    // DB에서 refresh token 확인
    const dbTokenData = await AuthModel.findByToken(token.refreshToken);

    // if (!dbTokenData || dbTokenData.token !== token.refreshToken) {
    //   console.log("dbTokenData:", dbTokenData);
    //   console.log("token.refreshToken:", token.refreshToken);
    //   throw new Error("Refresh token invalid or revoked");
    // }

    // if (dbTokenData.expiresAt.getTime() < Date.now()) {
    //   throw new Error("Refresh token expired"); // 로그아웃 처리
    // }
    if (!dbTokenData) {
      throw new Error("Refresh token not found in DB, invalid, or expired");
    }

    const newAccessToken = generateAccessToken({ id: decoded.id, email: decoded.email });
    const newRefreshToken = generateRefreshToken({ id: decoded.id, email: decoded.email });

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000);
    await AuthModel.updateRefreshToken(decoded.id, newRefreshToken, expiresAt);

    return {
      ...token,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExpires: Date.now() + ACCESS_TOKEN_EXPIRES_IN * 1000,
    };
  } catch (err) {
    console.error("refreshAccessToken error", err);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}