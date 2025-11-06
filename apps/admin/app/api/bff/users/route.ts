import { NextResponse } from "next/server";
import { UserModel } from "../../../models/user.model";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  console.log(searchParams);
  const page = Number(searchParams.get("page")) || 1;
  const size = Number(searchParams.get("size")) || 10;
  const name = searchParams.get("name");
  const result = await UserModel.getList(page, size, name || '');
  if (result) {
    return NextResponse.json({ success: true, data: result });
  }

  return NextResponse.json({ success: false, message: "조회 실패" }, { status: 400 });
}


