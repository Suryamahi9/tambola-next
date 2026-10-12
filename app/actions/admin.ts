"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/auth";
import { addMember, deleteMember, setMemberPassword } from "@/lib/auth/store";

export type AdminState = { error?: string; ok?: boolean } | undefined;

async function requireAdminOrError(): Promise<{ error: string } | { user: { id: string } }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "You must be an admin to do that." };
  }
  return { user };
}

export async function addMemberAction(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const gate = await requireAdminOrError();
  if ("error" in gate) return gate;

  const result = await addMember({
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    role: formData.get("role") === "admin" ? "admin" : "member",
  });

  if ("error" in result) return { error: result.error };
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteMemberAction(id: string): Promise<AdminState> {
  const gate = await requireAdminOrError();
  if ("error" in gate) return gate;
  if (gate.user.id === id) {
    return { error: "You can't remove your own account while signed in as it." };
  }
  const result = await deleteMember(id);
  if (result.error) return { error: result.error };
  revalidatePath("/admin");
  return { ok: true };
}

export async function resetPasswordAction(
  id: string,
  password: string
): Promise<AdminState> {
  const gate = await requireAdminOrError();
  if ("error" in gate) return gate;
  const result = await setMemberPassword(id, password);
  if (result.error) return { error: result.error };
  revalidatePath("/admin");
  return { ok: true };
}
