export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { AgentModel } from "../../../models/agent.model";
import { verifyToken } from "../../../utils/token";
import { SessionModel } from "../../../models/session.model";

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
  const page = Number(searchParams.get("page")) || 1;
  const size = Number(searchParams.get("size")) || 10;

  const result = await SessionModel.getList(page, size);
  if (result) {
    return NextResponse.json({ success: true, data: result });
  }

  return NextResponse.json({ success: false, message: "조회 실패" }, { status: 400 });
}