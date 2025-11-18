import { NextResponse } from "next/server";
import { AuthModel } from "../../../models/auth.model";
import { AdminModel } from "../../../models/admin.model";
import jwt from "jsonwebtoken";
import path from "path";
import { transporter, resetPasswordMailTemplate } from "../../../utils/nodemailer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "check-email") {
    const email = url.searchParams.get("email");
    if (!email) return NextResponse.json({ success: false }, { status: 400 });

    const user = await AuthModel.checkEmail(email);
    return NextResponse.json({ success: user });
  }

  if (action === "verify-reset-token") {
    const token = url.searchParams.get("token");
    if (!token) return NextResponse.json({ success: false }, { status: 400 });

    try {
      jwt.verify(token as string, process.env.NEXTAUTH_SECRET as string);
      return NextResponse.json({ valid: true });
    } catch (err) {
      return NextResponse.json({ valid: false });
    }
  }

  return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "pwfind") {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false }, { status: 400 });

    const user = await AuthModel.checkEmail(email);
    console.log("user: ", user);
    if (user) {
      const expiresInStr = process.env.NEXT_PUBLIC_RESET_TOKEN_EXPIRES_IN;
      console.log("expiresInStr", expiresInStr);


      let readableExpires = "";
      if (expiresInStr?.endsWith("m")) {
        readableExpires = `${parseInt(expiresInStr)}분`;
      } else if (expiresInStr?.endsWith("h")) {
        readableExpires = `${parseInt(expiresInStr)}시간`;
      } else if (expiresInStr?.endsWith("d")) {
        readableExpires = `${parseInt(expiresInStr)}일`;
      } else {
        readableExpires = "일정시간";
      }

      const token = jwt.sign(
        { email }, 
        process.env.NEXTAUTH_SECRET as string, 
        { expiresIn: expiresInStr || "30m" } as jwt.SignOptions
      );
      const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

      try {
        await transporter.sendMail({
          from: `"빌딩샵AI" <${process.env.SMTP_EMAIL}>`,
          to: email,
          subject: '비밀번호 재설정 안내',
          html: resetPasswordMailTemplate(resetLink, readableExpires),
          attachments: [{
            filename: 'buildingshop_BI.png',
            path: path.join(process.cwd(), "public", "buildingshop_BI.png"),
            cid: 'logo'
          }]
        });
      } catch (error) {
        console.error('메일 발송 실패:', error);
        return NextResponse.json({ success: false, message: '이메일 발송에 실패했습니다.' }, { status: 500 });
      }
    }
    return NextResponse.json({ success: user });
  }

  return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
}

export async function PUT(req: Request) {
  const { token, password } = await req.json();
  try{
    const decoded = jwt.verify(token as string, process.env.NEXTAUTH_SECRET as string);
    if (!decoded || !password) return NextResponse.json({ success: false }, { status: 400 });

    const user = await AdminModel.resetPassword((decoded as any).email, password);
    return NextResponse.json({ success: user });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

