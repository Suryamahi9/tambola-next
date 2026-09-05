"use client";

import { useActionState, useTransition, useState } from "react";
import {
  addMemberAction,
  deleteMemberAction,
  resetPasswordAction,
  type AdminState,
} from "@/app/actions/admin";
import type { MemberPublic } from "@/lib/auth/store";
import PasswordInput from "@/components/auth/PasswordInput";

export default function AdminPanel({ members }: { members: MemberPublic[] }) {
  const [addState, addAction, pending] = useActionState<AdminState, FormData>(
    addMemberAction,
    undefined
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [resetTarget, setResetTarget] = useState<MemberPublic | null>(null);
  const [newPassword, setNewPassword] = useState("");

  function runDelete(id: string, name: string) {
    if (!window.confirm(`Remove ${name}? They will lose access immediately.`)) return;
    setBusyId(id);
    setRowError(null);
    startTransition(async () => {
      const result = await deleteMemberAction(id);
      setBusyId(null);
      if (result?.error) setRowError(result.error);
    });
  }

  function runReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setBusyId(resetTarget.id);
    setRowError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(resetTarget.id, newPassword);
      setBusyId(null);
      if (result?.error) {
        setRowError(result.error);
      } else {
        setResetTarget(null);
        setNewPassword("");
      }
    });
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-3">
      <section className="glass min-w-0 rounded-3xl border border-white/10 p-6">
        <h2 className="font-display text-lg font-bold text-on-surface">Add member</h2>
        <p className="mt-1 text-xs text-on-surface-variant">
          Create a sign-in for a new player or co-host.
        </p>

        <form action={addAction} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="off"
              required
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Player name"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="off"
              required
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="off"
              minLength={6}
              required
              placeholder="6+ characters"
            />
          </div>
          <div>
            <label
              htmlFor="role"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              defaultValue="member"
            >
              <option value="member" className="bg-surface-container text-on-surface">Member</option>
              <option value="admin" className="bg-surface-container text-on-surface">Admin</option>
            </select>
          </div>

          {addState?.error && (
            <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
              {addState.error}
            </p>
          )}
          {addState?.ok && (
            <p className="rounded-lg border border-secondary-container/40 bg-secondary-container/10 px-3 py-2 text-sm text-secondary">
              Member added.
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-gradient-to-r from-primary-container via-primary to-primary-fixed px-5 py-3 text-sm font-bold text-on-primary-container shadow-lg shadow-primary/25 transition hover:brightness-110 disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add member"}
          </button>
        </form>
      </section>

      <section className="glass min-w-0 rounded-3xl border border-white/10 p-6 lg:col-span-2">
        <h2 className="font-display text-lg font-bold text-on-surface">
          Members <span className="ml-1 text-sm font-normal text-on-surface-variant">({members.length})</span>
        </h2>

        {rowError && (
          <p className="mt-3 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {rowError}
          </p>
        )}

        <div className="mt-5 min-w-0 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.map((member) => (
                <tr key={member.id} className="transition hover:bg-surface-container-low/60">
                  <td className="px-4 py-3 font-medium text-on-surface">
                    {member.name}
                    <span className="block text-xs font-normal text-on-surface-variant sm:hidden">
                      {member.email}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-on-surface-variant sm:table-cell">
                    {member.email}
                  </td>
                  <td className="px-4 py-3">
                    {member.role === "admin" ? (
                      <span className="rounded-full bg-tertiary-container/20 px-2.5 py-1 text-xs font-semibold text-tertiary">
                        Admin
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                        Member
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRowError(null);
                          setResetTarget(member);
                          setNewPassword("");
                        }}
                        disabled={busyId === member.id}
                        className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-white/10 hover:text-on-surface disabled:opacity-50"
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        onClick={() => runDelete(member.id, member.name)}
                        disabled={busyId === member.id || isPending}
                        className="rounded-full border border-error/30 px-3 py-1.5 text-xs font-semibold text-error transition hover:bg-error/10 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {resetTarget && (
          <form
            onSubmit={runReset}
            className="mt-5 rounded-2xl border border-white/10 bg-surface-container-low p-4"
          >
            <p className="text-sm font-semibold text-on-surface">
              Reset password for {resetTarget.name}
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
                  disabled={busyId === resetTarget.id}
                  className="rounded-full bg-gradient-to-r from-primary-container via-primary to-primary-fixed px-5 py-2.5 text-sm font-bold text-on-primary-container transition hover:brightness-110 disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:bg-white/10"
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