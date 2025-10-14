// "use server";

// import { NextRequest, NextResponse } from "next/server";
// import { verifyToken, refreshAccessToken } from "../../utils/token";
// import { AuthModel } from "../../models/auth.model";

// // 실제 admin API 호출 함수
// import { listAdmins } from "../../services/admin.service";
// import { checkEmail } from "../../services/admin.service";
// import { registerAdmin } from "../../../services/admin.service";

// export async function POST(req: NextRequest) {
//   try {
//     const url = new URL(req.url);
//     const pathname = url.pathname.replace("/api/bff", ""); // 실제 API 경로 분기용

//     // 1️⃣ 쿠키에서 accessToken 가져오기
//     const accessToken = req.cookies.get("next-auth.session-token")?.value;

//     // 2️⃣ 토큰 유효성 검사
//     if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     let decoded: any = verifyToken(accessToken);

//     // 3️⃣ accessToken 만료 → refresh
//     if (!decoded) {
//       const refreshToken = req.cookies.get("refresh-token")?.value;
//       if (!refreshToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//       const newTokens = await refreshAccessToken({ refreshToken });
//       if (newTokens.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//       decoded = verifyToken(newTokens.accessToken);

//       // 쿠키 업데이트
//       const res = NextResponse.next();
//       res.cookies.set("next-auth.session-token", newTokens.accessToken, { httpOnly: true, path: "/" });
//       res.cookies.set("refresh-token", newTokens.refreshToken, { httpOnly: true, path: "/" });
//     }

//     // 4️⃣ 실제 API 분기
//     if (pathname.endsWith("/admin/list")) {
//       const admins = await listAdmins();
//       return NextResponse.json(admins);
//     }

//     if (pathname.endsWith("/admin/check-email")) {
//       const body = await req.json();
//       const exists = await checkEmail(body.email);
//       return NextResponse.json({ exists });
//     }

//     if (pathname.endsWith("/admin/register")) {
//       const body = await req.json();
//       const newAdmin = await registerAdmin(body);
//       return NextResponse.json(newAdmin);
//     }

//     return NextResponse.json({ error: "Not found" }, { status: 404 });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }
