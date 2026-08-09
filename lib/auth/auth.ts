import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMemberById, type MemberPublic } from "./store";
import { verifyToken, SESSION_COOKIE } from "./session";

export const getCurrentUser = cache(async (): Promise<MemberPublic | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = verifyToken(token);
  if (!payload) return null;
  const member = getMemberById(payload.uid);
  if (!member) return null;
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    createdAt: member.createdAt,
  };
});

export async function requireMember(returnTo = "/game"): Promise<MemberPublic> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  return user;
}

export async function requireAdmin(returnTo = "/admin"): Promise<MemberPublic> {
  const user = await requireMember(returnTo);
  if (user.role !== "admin") {
    redirect("/");
  }
  return user;
}
