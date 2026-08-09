"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";

interface MeResponse {
  user: { id: string; name: string; email: string; role: string } | null;
}

export default function AuthNav({ variant }: { variant: "desktop" | "mobile" }) {
  const [user, setUser] = useState<MeResponse["user"] | "loading" | null>("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: MeResponse) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (variant === "desktop") {
    if (user === "loading") {
      return <span className="ml-1 h-2 w-16 animate-pulse rounded-full bg-white/10" aria-hidden />;
    }
    if (!user) {
      return (
        <Link
          href="/login"
          className="ml-2 inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Sign in
        </Link>
      );
    }
    return (
      <div className="ml-2 flex items-center gap-2">
        <span className="hidden text-sm text-neutral-400 lg:block">{user.name}</span>
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="inline-flex items-center rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:bg-white/10 hover:text-white"
          >
            Admin
          </Link>
        )}
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  // mobile
  if (user === "loading") {
    return null;
  }
  if (!user) {
    return (
      <Link
        href="/login"
        onClick={() => undefined}
        className="mt-2 block rounded-full border border-white/15 px-5 py-2.5 text-center text-sm font-semibold text-white"
      >
        Sign in
      </Link>
    );
  }
  return (
    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{user.name}</p>
        <p className="truncate text-xs text-neutral-500">{user.email}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {user.role === "admin" && (
          <Link
            href="/admin"
            onClick={() => undefined}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-neutral-300"
          >
            Admin
          </Link>
        )}
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-neutral-300"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
