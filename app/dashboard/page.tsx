import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/actions/members";
import AnalyticsPanel from "@/components/members/AnalyticsPanel";
import MembersPanel from "@/components/members/MembersPanel";
import { requireMember } from "@/lib/members/auth";
import { listMembers } from "@/lib/members/store";
import type { MemberPublic } from "@/lib/members/types";
import { getAllRooms } from "@/lib/room/store";
import type { Room } from "@/lib/room/types";
import { describeStoreError } from "@/lib/store-error";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage Golden Tambola members and review room analytics.",
};

export const dynamic = "force-dynamic";

function AccountCard({ member }: { member: MemberPublic }) {
  return (
    <section className="glass rounded-3xl border border-primary/20 p-6 shadow-xl shadow-black/40">
      <h2 className="gold-text font-headline-sm text-headline-sm">Your account</h2>
      <dl className="mt-4 space-y-3">
        {[
          { label: "Name", value: member.name },
          { label: "Email", value: member.email },
          { label: "Role", value: member.role === "admin" ? "Admin" : "Member" },
          { label: "Member since", value: new Date(member.createdAt).toLocaleDateString() },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 border-b border-primary/10 pb-2">
            <dt className="font-label-sm text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">
              {row.label}
            </dt>
            <dd className="font-body-md text-body-md font-medium text-on-surface">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 font-body-sm text-body-sm text-on-surface-variant">
        Admins can manage members below. Ask an admin to promote you if you need that access.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/play"
          className="gold-face gold-sheen relative overflow-hidden rounded-xl px-5 py-2.5 font-headline-sm text-headline-sm transition-transform hover:-translate-y-0.5"
        >
          Play a room
        </Link>
        <Link
          href="/game"
          className="rounded-xl border border-primary/25 px-5 py-2.5 font-headline-sm text-headline-sm text-on-surface transition hover:border-primary hover:text-primary"
        >
          Number caller
        </Link>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const me = await requireMember("/dashboard");
  const isAdmin = me.role === "admin";

  let members: MemberPublic[] = [];
  let rooms: Room[] = [];
  let storeError: string | null = null;
  if (isAdmin) {
    try {
      [members, rooms] = await Promise.all([listMembers(), getAllRooms()]);
    } catch (err) {
      storeError = describeStoreError(err);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 font-label-sm text-label-sm uppercase tracking-[0.28em] text-primary">
            <span className="material-symbols-outlined text-sm">
              {isAdmin ? "admin_panel_settings" : "badge"}
            </span>
            {isAdmin ? "Admin panel" : "Members area"}
          </span>
          <h1 className="gold-text mt-4 font-headline-lg text-headline-lg">
            {isAdmin ? "Manage members" : "Dashboard"}
          </h1>
          <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
            {isAdmin
              ? "Add members, adjust roles, reset passwords, and review room telemetry."
              : "Your Golden Tambola membership."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface-container-high px-4 py-2 font-label-md text-label-md text-on-surface-variant">
            <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden />
            {me.name}
            {isAdmin && <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary">admin</span>}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-primary/25 px-4 py-2 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant transition hover:border-primary hover:text-primary"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="marquee-bulbs mb-8" aria-hidden />

      {storeError && (
        <p className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 font-body-sm text-body-sm text-error">
          {storeError}
        </p>
      )}

      {isAdmin ? (
        <div className="space-y-10">
          <MembersPanel members={members} currentMemberId={me.id} />
          <div>
            <div className="mb-5 flex items-center gap-3">
              <h2 className="font-headline-md text-headline-md text-on-surface">Analytics</h2>
              <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Room telemetry
              </span>
            </div>
            <AnalyticsPanel rooms={rooms} />
          </div>
        </div>
      ) : (
        <AccountCard member={me} />
      )}
    </div>
  );
}
