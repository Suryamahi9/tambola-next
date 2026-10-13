import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_DAYS, secureCookieFlag, signToken, verifyToken } from "@/lib/auth/session";
import { getMemberById } from "./store";
import type { MemberPublic } from "./types";

/** Members use their own cookie so the player persona cookie (rooms/history)
 *  is untouched — a browser can be signed in as a member and a player at once. */
export const MEMBER_COOKIE = "tambola_member";

/** Members carry roles "admin" | "member"; players carry "player". */
const MEMBER_ROLES = new Set(["admin", "member"]);

/** The signed-in member, or null. Cached per request. Store/secret failures are
 *  treated as signed-out so pages redirect instead of 500ing. */
export const getCurrentMember = cache(async (): Promise<MemberPublic | null> => {
  try {
    const token = (await cookies()).get(MEMBER_COOKIE)?.value;
    const payload = await verifyToken(token);
    if (!payload || !MEMBER_ROLES.has(payload.role)) return null;
    const member = await getMemberById(payload.uid);
    if (!member) return null;
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      createdAt: member.createdAt,
    };
  } catch {
    return null;
  }
});

/** Set the member cookie. Only call from a Server Action / Route Handler —
 *  Next 16 silently drops Set-Cookie from a page render. */
export async function signInMember(member: { id: string; role: string }): Promise<void> {
  const token = await signToken(member.id, member.role);
  (await cookies()).set(MEMBER_COOKIE, token, {
    httpOnly: true,
    secure: secureCookieFlag(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function signOutMember(): Promise<void> {
  (await cookies()).delete(MEMBER_COOKIE);
}

export async function requireMember(returnTo = "/dashboard"): Promise<MemberPublic> {
  const member = await getCurrentMember();
  if (!member) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return member;
}

export async function requireAdmin(returnTo = "/dashboard"): Promise<MemberPublic> {
  const member = await requireMember(returnTo);
  if (member.role !== "admin") redirect("/dashboard");
  return member;
}
