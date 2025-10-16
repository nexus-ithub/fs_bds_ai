// /api/bff/admin/route.ts
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { AdminModel } from "../../../models/admin.model";
import { AuthModel } from "../../../models/auth.model";
import bcrypt from "bcryptjs";
import { verifyToken, refreshAccessToken } from "../../../utils/token";

async function handleAuth(req: Request) {
  const rawHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = rawHeader?.startsWith("Bearer ") ? rawHeader.split(" ")[1] : null;

  console.log("auth header:", rawHeader);
  console.log("token:", token);
  console.log("NEXTAUTH_SECRET defined:", Boolean(process.env.NEXTAUTH_SECRET));

  console.log("token preview:", token ? `${token.slice(0, 16)}...${token.slice(-8)}` : token);


  if (!token) return null;

  const decoded = verifyToken(token);
  console.log("decoded:", decoded);
  if (!decoded) return null;

  return decoded;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // 관리자 계정 목록
  if (action === "list") {
    const user = await handleAuth(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const users = await AdminModel.findAll();
    return NextResponse.json(users);
  }

  // 이메일 체크
  // if (action === "check-email") {
  //   const email = searchParams.get("email");
  //   console.log("email:", email);
  //   if (!email) return NextResponse.json({ success: false, message: "이메일이 없습니다." }, { status: 400 });

  //   const existing = await AuthModel.findByEmail(email);
  //   if (existing) return NextResponse.json({ success: false, message: "이미 존재하는 이메일입니다." }, { status: 400 });

  //   return NextResponse.json({ success: true, message: "사용 가능한 이메일입니다." });
  // }

  return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
}

export async function POST(req: Request) {
  const { action, email, name, phone, adminType } = await req.json();

  // admin 등록
  const user = await handleAuth(req);
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  if (action === "register") {
    if (!email || !name || !adminType) {
      return NextResponse.json({ success: false, message: "필수 값이 누락되었습니다." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10); // TODO: 임시 비밀번호
    const result = await AdminModel.register(email, hashedPassword, name, phone, adminType);

    if (result) {
      return NextResponse.json({ success: true, message: "관리자 계정이 생성되었습니다." });
    }
    return NextResponse.json({ success: false, message: "관리자 계정 생성에 실패했습니다." }, { status: 400 });
  }

  return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
}

export async function PUT(req: Request) {
  const { action, id, email, name, phone, adminType, deleteYn } = await req.json();

  const user = await handleAuth(req);
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  if (action === "update") {
    const result = await AdminModel.update(id, email, name, phone, adminType);
    return result
      ? NextResponse.json({ success: true, message: "관리자 계정이 수정되었습니다." })
      : NextResponse.json({ success: false, message: "수정 실패" }, { status: 400 });
  }

  if (action === "delete") {
    const result = await AdminModel.delete(id);
    return result
      ? NextResponse.json({ success: true, message: "관리자 계정이 삭제되었습니다." })
      : NextResponse.json({ success: false, message: "삭제 실패" }, { status: 400 });
  }

  return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
}
