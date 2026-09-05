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
      return <span className="h-2 w-16 animate-pulse rounded-full bg-white/10" aria-hidden />;
    }
    if (!user) {
      return (
        <Link
          href="/login"
          className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 font-label-lg text-label-lg text-on-surface transition hover:border-primary/40 hover:text-primary"
        >
          Sign in
        </Link>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span className="hidden font-label-md text-label-md text-on-surface-variant lg:block">{user.name}</span>
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="inline-flex items-center rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary/40 hover:text-primary"
          >
            Admin
          </Link>
        )}
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/40 hover:text-primary"
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
        className="mt-2 block rounded-xl border border-white/15 px-5 py-2.5 text-center font-label-lg text-label-lg text-on-surface"
      >
        Sign in
      </Link>
    );
  }
  return (
    <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-surface-container-low/60 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-on-surface">{user.name}</p>
        <p className="truncate text-xs text-on-surface-variant/70">{user.email}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-primary"
          >
            Admin
          </Link>
        )}
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-on-surface-variant"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
