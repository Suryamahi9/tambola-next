"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/actions/members";
import PasswordInput from "./PasswordInput";

const fieldLabel =
  "mb-1.5 block font-label-sm text-label-sm uppercase tracking-[0.18em] text-on-surface-variant";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, undefined);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className={fieldLabel}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-primary/20 bg-surface-container-lowest px-4 py-2.5 font-body-md text-body-md text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/25"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className={fieldLabel}>
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 font-body-sm text-body-sm text-error">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="gold-face gold-sheen relative w-full overflow-hidden rounded-xl px-5 py-3 font-headline-sm text-headline-sm transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
