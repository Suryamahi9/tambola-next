import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/members/LoginForm";
import SetupForm from "@/components/members/SetupForm";
import { getCurrentMember } from "@/lib/members/auth";
import { countMembers } from "@/lib/members/store";
import { safeMemberPath } from "@/lib/members/types";
import { describeStoreError } from "@/lib/store-error";

export const metadata: Metadata = {
  title: "Members",
  description: "Sign in to the Golden Tambola members area.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeMemberPath(next);

  const me = await getCurrentMember();
  if (me) redirect(nextPath);

  // Empty store ⇒ first-run: this screen creates the first admin instead of
  // asking for credentials nobody has yet.
  let firstRun = false;
  let storeError: string | null = null;
  try {
    firstRun = (await countMembers()) === 0;
  } catch (err) {
    storeError = describeStoreError(err);
  }

  return (
    <div className="carnival-glow mx-auto flex max-w-7xl flex-col items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 font-label-sm text-label-sm uppercase tracking-[0.28em] text-primary">
            <span className="material-symbols-outlined text-sm">
              {firstRun ? "auto_awesome" : "shield_person"}
            </span>
            {firstRun ? "First-time setup" : "Members area"}
          </span>
          <h1 className="gold-text mt-4 font-headline-lg text-headline-lg">
            {firstRun ? "Create your admin account" : "Welcome back"}
          </h1>
          <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
            {firstRun
              ? "No members exist yet. Create the first admin to unlock the dashboard."
              : "Sign in to manage members and see room analytics."}
          </p>
        </div>

        <div className="glass relative overflow-hidden rounded-3xl border border-primary/20 p-6 shadow-2xl shadow-black/50 sm:p-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
            aria-hidden
          />
          <div className="relative">
            {storeError ? (
              <p className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 font-body-sm text-body-sm text-error">
                {storeError}
              </p>
            ) : firstRun ? (
              <SetupForm />
            ) : (
              <LoginForm next={nextPath} />
            )}
          </div>
        </div>

        <p className="mt-6 text-center font-body-sm text-body-sm text-on-surface-variant/80">
          {firstRun ? "The caller and ticket generator stay free for everyone. " : "Members are invited by an admin. "}
          <Link href="/" className="font-semibold text-primary transition hover:text-primary-fixed">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
