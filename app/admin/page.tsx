import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/auth";
import { listMembers } from "@/lib/auth/store";
import AdminPanel from "@/components/admin/AdminPanel";

export const metadata: Metadata = {
  title: "Admin — Members",
  description: "Manage members who can access the Tambola caller and ticket generator.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin("/admin");
  const members = await listMembers();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
            Admin Panel
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white">
            Manage members
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Members can sign in to use the number caller and ticket generator.
            Admins can also access this panel.
          </p>
        </div>
        <span className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-neutral-300">
          Signed in as <span className="font-semibold text-white">{user.name}</span>
        </span>
      </div>

      <AdminPanel members={members} />
    </div>
  );
}
