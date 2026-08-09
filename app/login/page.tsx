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
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
            Members Only
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Sign in to use the number caller and ticket generator.
          </p>
        </div>

        <div className="glass rounded-3xl border border-white/10 p-6 shadow-2xl sm:p-8">
          <LoginForm next={nextPath} />
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Members are invited by an admin.{" "}
          <Link href="/" className="text-violet-300 hover:text-violet-200">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
