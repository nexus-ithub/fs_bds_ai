// /api/bff/admin/route.ts
export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { AdminModel } from "../../../models/admin.model";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const keyword = searchParams.get("keyword");
  const page = searchParams.get("page");
  const size = searchParams.get("size");

  // 관리자 계정 목록
  if (action === "list") {
    try {
      const result = await AdminModel.findAll(`%${keyword}%`, Number(page), Number(size));
      return NextResponse.json({ users: result?.users ?? [], totalCount: result?.totalCount ?? 0 });
    } catch (error) {
      return NextResponse.json({ success: false, message: "관리자 계정 조회 중 오류가 발생했습니다." }, { status: 500 });
    }
  }

  return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
}

export async function POST(req: Request) {
  const { action, email, name, phone, adminType } = await req.json();

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
