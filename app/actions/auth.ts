"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMemberByEmail } from "@/lib/auth/store";
import { verifyPassword } from "@/lib/auth/password";
import { signToken, SESSION_COOKIE } from "@/lib/auth/session";

export type AuthState = { error?: string } | undefined;

function safeNext(raw: FormDataEntryValue | null): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/game";
  }
  return raw;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email/username and password." };
  }

  const member = getMemberByEmail(email);
  if (!member || !verifyPassword(password, member.passwordHash, member.salt)) {
    return { error: "Invalid email or password." };
  }

  const token = signToken(member.id, member.role);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}
