import { createHmac, timingSafeEqual } from "node:crypto";
import { getSessionSecret } from "./store";

export const SESSION_COOKIE = "tambola_session";
export const SESSION_DAYS = 7;
/** Player persona cookies live as long as their token (tournament rooms run weeks). */
export const PLAYER_TOKEN_DAYS = 30;

/** Secure cookies on Vercel HTTPS by default (VERCEL=1 is auto-set); explicit
 *  COOKIE_SECURE always wins. Plain-http localhost keeps working. */
export function secureCookieFlag(): boolean {
  if (process.env.COOKIE_SECURE !== undefined) return process.env.COOKIE_SECURE === "true";
  return process.env.VERCEL === "1";
}

export interface SessionPayload {
  uid: string;
  role: string;
  exp: number;
  /** Member session version — bumped on password reset to kill old tokens. */
  sv?: number;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

async function hmac(data: string): Promise<string> {
  return createHmac("sha256", await getSessionSecret()).update(data).digest("base64url");
}

async function signPayload(payload: SessionPayload): Promise<string> {
  const body = base64url(JSON.stringify(payload));
  return `${body}.${await hmac(body)}`;
}

export async function signToken(uid: string, role: string, expDays = SESSION_DAYS): Promise<string> {
  return signPayload({
    uid,
    role,
    exp: Date.now() + expDays * 24 * 60 * 60 * 1000,
  });
}

/** Member tokens carry the session version so password resets kill old logins. */
export async function signMemberToken(member: { id: string; role: string; sessionVersion?: number }): Promise<string> {
  return signPayload({
    uid: member.id,
    role: member.role,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    sv: member.sessionVersion ?? 0,
  });
}

export async function verifyToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const expected = Buffer.from(await hmac(body));
    const actual = Buffer.from(sig);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.uid || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    // Bad encoding, or the signing secret itself is unreachable — either way
    // the token can't be trusted, and callers treat null as logged out.
    return null;
  }
}
