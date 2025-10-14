import { NextResponse } from "next/server";
import { AdminModel } from "../../../models/admin.model";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ success: false, message: '이메일이 없습니다.' }, { status: 400 })
  }

  const user = await AdminModel.findByEmail(email)

  if (user) {
    return NextResponse.json({ success: false, message: '이미 존재하는 이메일입니다.' }, { status: 400 })
  }

  return NextResponse.json({ success: true, message: '사용 가능한 이메일입니다.' }, { status: 200 })
}