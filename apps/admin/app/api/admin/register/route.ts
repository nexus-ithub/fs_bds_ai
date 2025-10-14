import { NextResponse } from "next/server";
import { AdminModel } from "../../../models/admin.model";
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const { email, name, phone, adminType } = await req.json();

  if (!email || !name || !adminType) {
    return NextResponse.json({ success: false, message: '필수 값이 누락되었습니다.' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);  // TODO: 임시 비밀번호

  const result = await AdminModel.register(email, hashedPassword, name, phone, adminType);

  if (result) {
    return NextResponse.json({ success: true, message: '관리자 계정이 생성되었습니다.' }, { status: 200 });
  }

  return NextResponse.json({ success: false, message: '관리자 계정 생성에 실패했습니다.' }, { status: 400 });
}