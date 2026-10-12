"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMemberByEmail } from "@/lib/auth/store";
import { verifyPassword } from "@/lib/auth/password";
import { signMemberToken, secureCookieFlag, SESSION_COOKIE } from "@/lib/auth/session";

export type AuthState = { error?: string } | undefined;

function safeNext(raw: FormDataEntryValue | null): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/game";
  }
  return raw;
}

// Brute-force friction: 5 bad attempts per email locks that email for a minute.
// (In-memory per instance — a speed bump, not a vault.)
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;
const attempts = new Map<string, { count: number; lockedUntil: number }>();

function lockedOut(email: string): number {
  const entry = attempts.get(email);
  if (!entry) return 0;
  if (Date.now() > entry.lockedUntil && entry.count < MAX_ATTEMPTS) {
    attempts.delete(email);
    return 0;
  }
  return entry.count >= MAX_ATTEMPTS ? Math.max(0, entry.lockedUntil - Date.now()) : 0;
}

function noteFailure(email: string): void {
  const entry = attempts.get(email) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) entry.lockedUntil = Date.now() + LOCK_MS;
  attempts.set(email, entry);
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const waitMs = lockedOut(email);
  if (waitMs > 0) {
    return { error: `Too many attempts — try again in ${Math.ceil(waitMs / 1000)}s.` };
  }

  try {
    const member = await getMemberByEmail(email);
    if (!member || !verifyPassword(password, member.passwordHash, member.salt)) {
      noteFailure(email);
      return { error: "Invalid email or password." };
    }
    attempts.delete(email);

    const token = await signMemberToken(member);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: secureCookieFlag(),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch (err) {
    // Corruption and connectivity need different remedies — don't conflate them.
    if (err instanceof Error && err.message.includes("corrupted")) {
      return { error: err.message };
    }
    return {
      error:
        "The member store is not writable. On Vercel, connect a Blob store to this project (Dashboard → Storage → Create Blob → Connect) so BLOB_READ_WRITE_TOKEN is available.",
    };
  }

  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}
