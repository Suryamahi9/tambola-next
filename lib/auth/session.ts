import { createHmac, timingSafeEqual } from "node:crypto";
import { getSessionSecret } from "./store";

export const SESSION_COOKIE = "tambola_session";
export const SESSION_DAYS = 7;

export interface SessionPayload {
  uid: string;
  role: string;
  exp: number;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function hmac(data: string): string {
  return createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
}

export function signToken(uid: string, role: string): string {
  const payload: SessionPayload = {
    uid,
    role,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${hmac(body)}`;
}

export function verifyToken(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(hmac(body));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.uid || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
