export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { SessionModel } from "../../../../models/session.model";

export async function GET(
  req: Request, 
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  const result = await SessionModel.getChatContent(sessionId);
  
  if (result) {
    return NextResponse.json({ success: true, data: result });
  }
  return NextResponse.json({ success: false, message: "조회 실패" }, { status: 400 });
}