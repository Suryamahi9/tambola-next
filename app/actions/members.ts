"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentMember, signInMember, signOutMember } from "@/lib/members/auth";
import { verifyPassword } from "@/lib/members/password";
import {
  addMember,
  createFirstAdmin,
  deleteMember,
  getMemberByEmail,
  setMemberPassword,
  setMemberRole,
} from "@/lib/members/store";
import { MIN_PASSWORD_LENGTH, safeMemberPath } from "@/lib/members/types";
import { describeStoreError } from "@/lib/store-error";

export type FormState = { error?: string; ok?: boolean; message?: string } | undefined;

/* ------------------------------------------------------------------ *
 * Brute-force friction: 5 bad attempts locks an email for a minute.    *
 * In-memory per instance — a speed bump, not a vault.                 *
 * ------------------------------------------------------------------ */
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;
const attempts = new Map<string, { count: number; lockedUntil: number }>();

function lockRemaining(email: string): number {
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

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeMemberPath(formData.get("next"));

  if (!email || !password) return { error: "Enter your email and password." };

  const wait = lockRemaining(email);
  if (wait > 0) return { error: `Too many attempts — try again in ${Math.ceil(wait / 1000)}s.` };

  let member;
  try {
    member = await getMemberByEmail(email);
  } catch (err) {
    console.error("[members] login lookup failed:", err);
    return { error: describeStoreError(err) };
  }

  if (!member || !verifyPassword(password, member.passwordHash, member.salt)) {
    noteFailure(email);
    return { error: "Invalid email or password." };
  }

  attempts.delete(email);
  await signInMember(member);
  redirect(next); // outside try/catch so its special redirect error isn't swallowed
}

/** First-run setup — becomes an admin and signs in. Only works on an empty store. */
export async function setupAdminAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!email || !password) return { error: "Enter an email and password." };
  if (password !== confirm) return { error: "Those passwords don't match." };

  try {
    const created = await createFirstAdmin({ name, email, password });
    if ("error" in created) return { error: created.error };
    await signInMember(created);
  } catch (err) {
    console.error("[members] first-admin setup failed:", err);
    return { error: describeStoreError(err) };
  }
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await signOutMember();
  redirect("/");
}

async function requireAdminState(): Promise<{ error: string } | { memberId: string }> {
  const me = await getCurrentMember();
  if (!me || me.role !== "admin") return { error: "You must be an admin to do that." };
  return { memberId: me.id };
}

export async function addMemberAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const gate = await requireAdminState();
  if ("error" in gate) return gate;

  try {
    const result = await addMember({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "member"),
    });
    if ("error" in result) return { error: result.error };
  } catch (err) {
    console.error("[members] add failed:", err);
    return { error: describeStoreError(err) };
  }

  revalidatePath("/dashboard");
  return { ok: true, message: "Member added." };
}

export async function deleteMemberAction(id: string): Promise<FormState> {
  const gate = await requireAdminState();
  if ("error" in gate) return gate;
  if (gate.memberId === id) {
    return { error: "You can't remove the account you're signed in as." };
  }

  try {
    const result = await deleteMember(id);
    if (result.error) return { error: result.error };
  } catch (err) {
    console.error("[members] remove failed:", err);
    return { error: describeStoreError(err) };
  }

  revalidatePath("/dashboard");
  return { ok: true, message: "Member removed." };
}

export async function resetPasswordAction(id: string, password: string): Promise<FormState> {
  const gate = await requireAdminState();
  if ("error" in gate) return gate;
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  try {
    const result = await setMemberPassword(id, password);
    if (result.error) return { error: result.error };
  } catch (err) {
    console.error("[members] password reset failed:", err);
    return { error: describeStoreError(err) };
  }

  revalidatePath("/dashboard");
  return { ok: true, message: "Password updated." };
}

export async function setRoleAction(id: string, role: string): Promise<FormState> {
  const gate = await requireAdminState();
  if ("error" in gate) return gate;

  try {
    const result = await setMemberRole(id, role);
    if (result.error) return { error: result.error };
  } catch (err) {
    console.error("[members] role change failed:", err);
    return { error: describeStoreError(err) };
  }

  revalidatePath("/dashboard");
  return { ok: true, message: "Role updated." };
}
