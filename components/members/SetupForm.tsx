"use client";

import { useActionState } from "react";
import { setupAdminAction, type FormState } from "@/app/actions/members";
import PasswordInput from "./PasswordInput";

const fieldLabel =
  "mb-1.5 block font-label-sm text-label-sm uppercase tracking-[0.18em] text-on-surface-variant";
const field =
  "w-full rounded-xl border border-primary/20 bg-surface-container-lowest px-4 py-2.5 font-body-md text-body-md text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/25";

/** Shown on /login while the store is empty: create the first admin. */
export default function SetupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(setupAdminAction, undefined);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="setup-name" className={fieldLabel}>
          Your name
        </label>
        <input id="setup-name" name="name" type="text" autoComplete="name" className={field} placeholder="Admin" />
      </div>
      <div>
        <label htmlFor="setup-email" className={fieldLabel}>
          Email
        </label>
        <input
          id="setup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={field}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="setup-password" className={fieldLabel}>
          Password
        </label>
        <PasswordInput
          id="setup-password"
          name="password"
          autoComplete="new-password"
          minLength={6}
          required
          placeholder="6+ characters"
        />
      </div>
      <div>
        <label htmlFor="setup-confirm" className={fieldLabel}>
          Confirm password
        </label>
        <PasswordInput
          id="setup-confirm"
          name="confirm"
          autoComplete="new-password"
          minLength={6}
          required
          placeholder="Repeat the password"
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
        {pending ? "Creating…" : "Create admin account"}
      </button>
    </form>
  );
}
