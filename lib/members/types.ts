/**
 * Member accounts power the members dashboard only — /game and /tickets stay
 * public. This module is deliberately client-safe (types + constants + a tiny
 * path guard, no node: imports) so client components can import from it without
 * dragging in node:crypto / node:fs like the store does.
 */

export type MemberRole = "admin" | "member";

export interface Member {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: MemberRole;
  createdAt: string;
}

/** A member with the password material stripped — safe to send to the client. */
export type MemberPublic = Omit<Member, "passwordHash" | "salt">;

export const MIN_PASSWORD_LENGTH = 6;

/** Where to land after sign-in. Only same-origin, non-protocol paths are
 *  allowed, and /login itself is never a target (that would bounce forever). */
export function safeMemberPath(raw: unknown, fallback = "/dashboard"): string {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed === "/login" || trimmed.startsWith("/login?")) return fallback;
  return trimmed;
}
