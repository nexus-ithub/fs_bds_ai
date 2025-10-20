export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { AgentModel } from "../../../models/agent.model";
import { verifyToken } from "../../../utils/token";

async function handleAuth(req: Request) {
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

  const result = await AgentModel.getSetting();
  if (result) {
    return NextResponse.json({ success: true, data: result });
  }

  return NextResponse.json({ success: false, message: "조회 실패" }, { status: 400 });
}

export async function PUT(req: Request) {
  const { agentName, nameDesc, newchatLabel, chatTitle, chatSubtitle, placeholder, warningMsg, questions } = await req.json();

  const user = await handleAuth(req);
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const result = await AgentModel.update({ agentName, nameDesc, newchatLabel, chatTitle, chatSubtitle, placeholder, warningMsg, questions });
  if (result) {
    return NextResponse.json({ success: true, message: "Agent 설정이 수정되었습니다." });
  }

  return NextResponse.json({ success: false, message: "수정 실패" }, { status: 400 });
}