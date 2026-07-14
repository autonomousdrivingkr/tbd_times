import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, checkPassword, createSessionToken, isAdminEnabled } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** 로그인: 비밀번호가 맞으면 서명된 세션 쿠키를 발급한다. */
export async function POST(req: NextRequest) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ ok: false, error: "admin_disabled" }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!checkPassword(password)) {
    return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 401 });
  }
  const { token, maxAgeSeconds } = createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
  return res;
}

/** 로그아웃: 세션 쿠키를 지운다. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
