export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { SessionModel } from "../../../models/session.model";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const size = Number(searchParams.get("size")) || 10;

  const result = await SessionModel.getList(page, size);
  if (result) {
    return NextResponse.json({ success: true, data: result });
  }

  return NextResponse.json({ success: false, message: "조회 실패" }, { status: 400 });
}