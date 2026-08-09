"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/app/actions/auth";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    loginAction,
    undefined
  );

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-400"
        >
          Email or username
        </label>
        <input
          id="email"
          name="email"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-xl border border-white/15 bg-[#0b0d1a] px-4 py-2.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          placeholder="you@example.com or username"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-400"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-white/15 bg-[#0b0d1a] px-4 py-2.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          placeholder="••••••••"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
