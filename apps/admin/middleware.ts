import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (err: any) {
    console.error("verifyToken error:", err?.name, err?.message);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const rawHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = rawHeader?.startsWith("Bearer ") ? rawHeader.split(" ")[1] : null;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-data", JSON.stringify(decoded));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/api/bff/admin/:path*",
    "/api/bff/agent/:path*",
    "/api/bff/bd-consult/:path*",
    "/api/bff/design-consult/:path*",
    "/api/bff/session/:path*",
    "/api/bff/users/:path*",
  ],
};
