import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// 관리자(/admin) 로그인 세션. 별도 DB 없이 ADMIN_PASSWORD 를 서명 키로 쓰는
// stateless 토큰(만료시각 + HMAC 서명)으로 처리한다 — 1인 운영 도구에 맞는
// 최소한의 인증. ADMIN_PASSWORD 가 없으면 관리자 기능 전체가 비활성화된다.

export const ADMIN_COOKIE = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7일

function secret(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

export function isAdminEnabled(): boolean {
  return Boolean(secret());
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function checkPassword(password: string): boolean {
  const key = secret();
  if (!key || !password) return false;
  return timingSafeEqual(password, key);
}

function sign(expiry: number): string {
  const key = secret();
  if (!key) throw new Error("ADMIN_PASSWORD not set");
  return crypto.createHmac("sha256", key).update(String(expiry)).digest("hex");
}

/** 로그인 성공 시 쿠키에 담을 세션 토큰을 만든다. */
export function createSessionToken(): { token: string; maxAgeSeconds: number } {
  const expiry = Date.now() + SESSION_TTL_MS;
  return { token: `${expiry}.${sign(expiry)}`, maxAgeSeconds: SESSION_TTL_MS / 1000 };
}

/** 쿠키에서 읽은 토큰이 유효한지 검증한다(만료·서명 위조 여부). */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || !isAdminEnabled()) return false;
  const [expiryStr, sig] = token.split(".");
  const expiry = Number(expiryStr);
  if (!expiry || !sig || Number.isNaN(expiry) || Date.now() > expiry) return false;
  try {
    return timingSafeEqual(sig, sign(expiry));
  } catch {
    return false;
  }
}

/** API 라우트에서 요청 쿠키만으로 관리자 인증 여부를 확인한다. */
export function isAuthedRequest(req: NextRequest): boolean {
  return verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

/** 현재 요청(Server Component)이 로그인된 세션인지 확인한다. */
export async function isAdminPageAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** 관리자 페이지 진입점에서 호출: 미인증이면 로그인 페이지로 리다이렉트한다. */
export async function requireAdminPage(): Promise<void> {
  if (!(await isAdminPageAuthed())) {
    redirect("/admin/login");
  }
}
