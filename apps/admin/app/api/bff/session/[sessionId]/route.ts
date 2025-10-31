export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { verifyToken } from "../../../../utils/token";
import { SessionModel } from "../../../../models/session.model";

function handleAuth(req: Request) {
  const rawHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = rawHeader?.startsWith("Bearer ") ? rawHeader.split(" ")[1] : null;
  
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return decoded;
}

export async function GET(req: Request, { params }: { params: { sessionId: string } }) {
  const user = await handleAuth(req);
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { sessionId } = params;

  const result = await SessionModel.getChatContent(sessionId);
  if (result) {
    return NextResponse.json({ success: true, data: result });
  }

  return NextResponse.json({ success: false, message: "조회 실패" }, { status: 400 });
}