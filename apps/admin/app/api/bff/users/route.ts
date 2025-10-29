import { NextResponse } from "next/server";
import { verifyToken } from "../../../utils/token";
import { UserModel } from "../../../models/user.model";
function handleAuth(req: Request) {
  const rawHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = rawHeader?.startsWith("Bearer ") ? rawHeader.split(" ")[1] : null;
  
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return decoded;
}


export async function GET(req: Request) {
  const user = await handleAuth(req);
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

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


