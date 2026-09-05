import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/auth";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Member Login",
  description: "Sign in to access the Tambola number caller and ticket generator.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  const nextPath =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/game";

  if (user) redirect(nextPath);

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm uppercase tracking-widest text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            Members Only
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-on-surface">
            Welcome back
          </h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Sign in to use the number caller and ticket generator.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-6 shadow-2xl shadow-black/40 sm:p-8 [border:1px_solid_var(--color-outline-variant)]">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary-container/20 blur-3xl"
            aria-hidden
          />
          <LoginForm next={nextPath} />
        </div>

        <p className="mt-6 text-center text-body-sm text-on-surface-variant/70">
          Members are invited by an admin.{" "}
          <Link href="/" className="font-semibold text-primary hover:text-primary-fixed">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
