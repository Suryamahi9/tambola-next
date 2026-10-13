"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  addMemberAction,
  deleteMemberAction,
  resetPasswordAction,
  setRoleAction,
  type FormState,
} from "@/app/actions/members";
import type { MemberPublic } from "@/lib/members/types";
import PasswordInput from "./PasswordInput";

const fieldLabel =
  "mb-1.5 block font-label-sm text-label-sm uppercase tracking-[0.18em] text-on-surface-variant";
const field =
  "w-full rounded-xl border border-primary/20 bg-surface-container-lowest px-4 py-2.5 font-body-md text-body-md text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/25";

export default function MembersPanel({
  members,
  currentMemberId,
}: {
  members: MemberPublic[];
  currentMemberId: string;
}) {
  const [addState, addAction, adding] = useActionState<FormState, FormData>(addMemberAction, undefined);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowMessage, setRowMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [resetTarget, setResetTarget] = useState<MemberPublic | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [members, query]);

  function run(action: () => Promise<FormState>, id: string, okText: string, onDone?: () => void) {
    setBusyId(id);
    setRowMessage(null);
    startTransition(async () => {
      const result = await action();
      setBusyId(null);
      if (result?.error) setRowMessage({ tone: "error", text: result.error });
      else {
        setRowMessage({ tone: "ok", text: result?.message ?? okText });
        onDone?.();
      }
    });
  }

  function runDelete(member: MemberPublic) {
    if (!window.confirm(`Remove ${member.name}? They will lose access immediately.`)) return;
    run(() => deleteMemberAction(member.id), member.id, "Member removed.");
  }

  function runReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    run(
      () => resetPasswordAction(resetTarget.id, newPassword),
      resetTarget.id,
      "Password updated.",
      () => {
        setResetTarget(null);
        setNewPassword("");
      }
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-3">
      {/* Add member */}
      <section className="glass min-w-0 self-start rounded-3xl border border-primary/20 p-6 shadow-xl shadow-black/40">
        <h2 className="gold-text font-headline-sm text-headline-sm">Add member</h2>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Create a sign-in for a new player or co-host.
        </p>

        <form action={addAction} className="mt-5 space-y-4">
          <div>
            <label htmlFor="member-name" className={fieldLabel}>
              Name
            </label>
            <input id="member-name" name="name" type="text" autoComplete="off" className={field} placeholder="Player name" />
          </div>
          <div>
            <label htmlFor="member-email" className={fieldLabel}>
              Email
            </label>
            <input
              id="member-email"
              name="email"
              type="email"
              autoComplete="off"
              required
              className={field}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="member-password" className={fieldLabel}>
              Password
            </label>
            <PasswordInput
              id="member-password"
              name="password"
              autoComplete="off"
              minLength={6}
              required
              placeholder="6+ characters"
            />
          </div>
          <div>
            <label htmlFor="member-role" className={fieldLabel}>
              Role
            </label>
            <select id="member-role" name="role" defaultValue="member" className={field}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {addState?.error && (
            <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 font-body-sm text-body-sm text-error">
              {addState.error}
            </p>
          )}
          {addState?.ok && (
            <p className="rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2 font-body-sm text-body-sm text-secondary">
              {addState.message ?? "Member added."}
            </p>
          )}

          <button
            type="submit"
            disabled={adding}
            className="gold-face gold-sheen relative w-full overflow-hidden rounded-xl px-5 py-3 font-headline-sm text-headline-sm transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
          >
            {adding ? "Adding…" : "Add member"}
          </button>
        </form>
      </section>

      {/* Member list */}
      <section className="glass min-w-0 rounded-3xl border border-primary/20 p-6 shadow-xl shadow-black/40 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            Members <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">({members.length})</span>
          </h2>
          <label className="relative">
            <span className="sr-only">Search members</span>
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant/60">
              search
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email"
              className="w-full min-w-[12rem] rounded-xl border border-primary/20 bg-surface-container-lowest py-2 pl-10 pr-3 font-body-sm text-body-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/25 sm:w-64"
            />
          </label>
        </div>

        {rowMessage && (
          <p
            className={`mt-3 rounded-lg border px-3 py-2 font-body-sm text-body-sm ${
              rowMessage.tone === "error"
                ? "border-error/30 bg-error/10 text-error"
                : "border-secondary/30 bg-secondary/10 text-secondary"
            }`}
          >
            {rowMessage.text}
          </p>
        )}

        <div className="mt-5 min-w-0 overflow-x-auto rounded-2xl border border-primary/15">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center font-body-sm text-body-sm text-on-surface-variant">
                    {members.length === 0 ? "No members yet." : "No members match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((member) => {
                  const isSelf = member.id === currentMemberId;
                  const busy = busyId === member.id || isPending;
                  return (
                    <tr key={member.id} className="transition hover:bg-surface-container-low/60">
                      <td className="px-4 py-3 font-body-md text-body-md font-medium text-on-surface">
                        {member.name}
                        {isSelf && <span className="ml-2 text-[10px] uppercase tracking-wider text-primary">you</span>}
                        <span className="block font-body-sm text-body-sm font-normal text-on-surface-variant sm:hidden">
                          {member.email}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 font-body-md text-body-md text-on-surface-variant sm:table-cell">
                        {member.email}
                      </td>
                      <td className="px-4 py-3">
                        <label className="sr-only" htmlFor={`role-${member.id}`}>
                          Role for {member.name}
                        </label>
                        <select
                          id={`role-${member.id}`}
                          value={member.role}
                          disabled={busy || isSelf}
                          title={isSelf ? "You can't change your own role" : undefined}
                          onChange={(e) => run(() => setRoleAction(member.id, e.target.value), member.id, "Role updated.")}
                          className="rounded-lg border border-primary/20 bg-surface-container-lowest px-2.5 py-1.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRowMessage(null);
                              setResetTarget(member);
                              setNewPassword("");
                            }}
                            disabled={busy}
                            className="rounded-full border border-primary/25 px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-50"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => runDelete(member)}
                            disabled={busy || isSelf}
                            title={isSelf ? "You can't remove your own account" : undefined}
                            className="rounded-full border border-error/30 px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-wider text-error transition hover:bg-error/10 disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {resetTarget && (
          <form onSubmit={runReset} className="mt-5 rounded-2xl border border-primary/20 bg-surface-container-low p-4">
            <p className="font-body-md text-body-md font-semibold text-on-surface">
              Reset password for <span className="text-primary">{resetTarget.name}</span>
            </p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Their existing signed-in tabs stay active until the token expires.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <PasswordInput
                id="reset-password"
                autoComplete="off"
                minLength={6}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (6+ characters)"
                className="flex-1"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busyId === resetTarget.id || isPending}
                  className="gold-face rounded-full px-5 py-2.5 font-label-md text-label-md transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="rounded-full border border-primary/25 px-5 py-2.5 font-label-md text-label-md text-on-surface-variant transition hover:border-primary hover:text-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
