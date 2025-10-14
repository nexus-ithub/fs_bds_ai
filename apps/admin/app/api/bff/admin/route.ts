// /api/bff/admin/route.ts
import { NextResponse } from "next/server";
import { AdminModel } from "../../../models/admin.model";
import { AuthModel } from "../../../models/auth.model";
import bcrypt from "bcryptjs";
import { verifyToken, refreshAccessToken } from "../../../utils/token";

// BFF는 모든 요청에서 accessToken 검증 후 필요한 경우 refresh
async function handleAuth(req: Request) {
  const tokenCookie = req.headers.get("cookie")?.split("accessToken=")?.[1];
  if (!tokenCookie) return null;

  const decoded = verifyToken(tokenCookie);
  if (!decoded) return null;

  return decoded;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // 토큰 검증 (list는 로그인 필요)
  if (action === "list") {
    const user = await handleAuth(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const users = await AdminModel.findAll();
    return NextResponse.json(users);
  }

  // 이메일 체크는 토큰 필요 없음
  if (action === "check-email") {
    const email = searchParams.get("email");
    if (!email) return NextResponse.json({ success: false, message: "이메일이 없습니다." }, { status: 400 });

    const existing = await AuthModel.findByEmail(email);
    if (existing) return NextResponse.json({ success: false, message: "이미 존재하는 이메일입니다." }, { status: 400 });

    return NextResponse.json({ success: true, message: "사용 가능한 이메일입니다." });
  }

  return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
}

export async function POST(req: Request) {
  const { action, email, name, phone, adminType } = await req.json();

  // admin 등록은 로그인 필요
  const user = await handleAuth(req);
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  if (action === "register") {
    if (!email || !name || !adminType) {
      return NextResponse.json({ success: false, message: "필수 값이 누락되었습니다." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10); // 임시 비밀번호
    const result = await AdminModel.register(email, hashedPassword, name, phone, adminType);

    if (result) {
      return NextResponse.json({ success: true, message: "관리자 계정이 생성되었습니다." });
    }
    return NextResponse.json({ success: false, message: "관리자 계정 생성에 실패했습니다." }, { status: 400 });
  }

  return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
}
