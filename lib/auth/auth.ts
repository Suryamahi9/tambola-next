import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMemberById, type MemberPublic } from "./store";
import { verifyToken, SESSION_COOKIE } from "./session";

export const getCurrentUser = cache(async (): Promise<MemberPublic | null> => {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const payload = await verifyToken(token);
    if (!payload) return null;
    const member = await getMemberById(payload.uid);
    if (!member) return null;
    // Password resets bump sessionVersion, killing older tokens.
    if ((member.sessionVersion ?? 0) !== (payload.sv ?? 0)) return null;
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      createdAt: member.createdAt,
    };
  } catch {
    // Store/secret unavailable (e.g. read-only FS without Blob) — treat as
    // logged out so pages redirect to /login instead of 500ing.
    return null;
  }
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
