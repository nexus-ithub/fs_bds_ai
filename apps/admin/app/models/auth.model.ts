import { db } from "../utils/db";
import { RowDataPacket } from "mysql2";
import { Admin } from "@repo/common";

export class AuthModel {

  static async findByEmail(email: string): Promise<Admin | null> {
    try {
      const users = await db.query<(RowDataPacket & Admin)[]>(
        'SELECT * FROM admins WHERE email = ? LIMIT 1',
        [email]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error; 
    }
  } 

  static async findById(id: string): Promise<any> {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM admins WHERE id = ? LIMIT 1",
      [id]
    );
    return (rows as any)[0] || null;
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
    console.log(">>>token : ", token)
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT token, expires_at as expiresAt FROM admin_refresh_tokens WHERE token = ? AND expires_at > NOW()",
      [token]
    );
    console.log(">>>rows : ", rows)
    return (rows as any) || null;
  }
}