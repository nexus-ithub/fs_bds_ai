import { db } from "../utils/db";
import { RowDataPacket } from "mysql2";
import { Admin } from "@repo/common";
import { trackError } from "../utils/analytics";

export class AuthModel {

  static async findByEmail(email: string): Promise<Admin | null> {
    try {
      const users = await db.query<(RowDataPacket & Admin)[]>(
        'SELECT id, email, password, name, phone, admin_type as adminType FROM admins WHERE email = ? AND delete_yn = "N" LIMIT 1',
        [email]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      trackError(error,{
        message: "이메일로 관리자 계정 조회 중 오류가 발생했습니다.",
        file: "auth.model.ts",
        function: "findByEmail",
        severity: "error"
      })
      throw error; 
    }
  } 

  static async checkEmail(email: string): Promise<boolean> {
    try{
      const users = await db.query<(RowDataPacket & Admin)[]>(
        'SELECT * FROM admins WHERE email = ? LIMIT 1',
        [email]
      );
      return users[0] ? true : false;
    } catch (error) {
      console.error('Error checking email:', error);
      trackError(error,{
        message: "이메일로 관리자 계정 조회 중 오류가 발생했습니다.",
        file: "auth.model.ts",
        function: "checkEmail",
        severity: "error"
      })
      throw error; 
    }
  }

  static async findById(id: string): Promise<any> {
    try{
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM admins WHERE id = ? AND delete_yn = 'N' LIMIT 1",
        [id]
      );
      return (rows as any)[0] || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      trackError(error,{
        message: "ID로 관리자 계정 조회 중 오류가 발생했습니다.",
        file: "auth.model.ts",
        function: "findById",
        severity: "error"
      })
      throw error; 
    }
  }

  static async updateRefreshToken(adminId: string, refreshToken: string | null, expiresAt: Date): Promise<void> {
    await db.query(
      "INSERT INTO admin_refresh_tokens (admin_id, token, expires_at) VALUES (?, ?, ?)",
      [adminId, refreshToken, expiresAt]
    );
    // admin_id의 마지막 토큰 조회
    // const rows: any[] = await db.query(
    //   "SELECT * FROM admin_refresh_tokens WHERE admin_id = ? ORDER BY id DESC LIMIT 1",
    //   [adminId]
    // );

    // const lastToken = rows[0]?.[0];

    // if (!lastToken || new Date(lastToken.expires_at).getTime() < Date.now()) {
    //   // 토큰이 없거나 만료되었으면 INSERT
    //   await db.query(
    //     "INSERT INTO admin_refresh_tokens (admin_id, token, expires_at) VALUES (?, ?, ?)",
    //     [adminId, refreshToken, expiresAt]
    //   );
    // } else {
    //   // 아직 유효한 토큰이 있으면 UPDATE
    //   await db.query(
    //     "UPDATE admin_refresh_tokens SET token = ?, expires_at = ? WHERE admin_id = ?",
    //     [refreshToken, expiresAt, adminId]
    //   );
    // }
  }


  static async findByToken(token: string): Promise<any> {
    try{
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT token, expires_at as expiresAt FROM admin_refresh_tokens WHERE token = ? AND expires_at > NOW()",
        [token]
      );
      return (rows as any) || null;
    } catch (error) {
      console.error('Error finding user by token:', error);
      trackError(error,{
        message: "토큰으로 관리자 계정 조회 중 오류가 발생했습니다.",
        file: "auth.model.ts",
        function: "findByToken",
        severity: "error"
      })
      throw error; 
    }
  }
}