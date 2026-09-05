import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/auth";
import { listMembers } from "@/lib/auth/store";
import { getAllRooms } from "@/lib/room/store";
import AdminPanel from "@/components/admin/AdminPanel";
import AnalyticsPanel from "@/components/admin/AnalyticsPanel";

export const metadata: Metadata = {
  title: "Admin — Members",
  description: "Manage members who can access the Tambola caller and ticket generator.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin("/admin");
  const [members, rooms] = await Promise.all([listMembers(), getAllRooms()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm uppercase tracking-widest text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            Admin Panel
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-on-surface">
            Manage members
          </h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Members can sign in to use the number caller and ticket generator.
            Admins can also access this panel.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-2 font-label-md text-label-md uppercase tracking-wider text-on-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden />
          Signed in as <span className="font-bold text-primary">{user.name}</span>
        </span>
      </div>

      <AdminPanel members={members} />

      <div className="mt-10">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-display text-xl font-bold text-on-surface">Analytics</h2>
          <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Room Telemetry
          </span>
        </div>
        <AnalyticsPanel rooms={rooms} />
      </div>
    </div>
  );
}
