import { NextResponse } from "next/server";
import { AuthModel } from "../../../models/auth.model";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "check-email") {
    const email = url.searchParams.get("email");
    if (!email) return NextResponse.json({ success: false }, { status: 400 });

    const user = await AuthModel.checkEmail(email);
    return NextResponse.json({ success: user });
  }

  return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
}
