import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest py-12">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="opacity-70">
            <Logo />
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant">
            © {new Date().getFullYear()} Grand Tambola Salon. Real-Time Certified RNG Engine.
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Fair Play Protocol v4.8</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Auto-Sync Cluster Active</span>
          <span className="font-label-sm text-label-sm text-secondary-fixed flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span> Systems Operational
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/rules" className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest transition hover:text-primary">
            Rules & Patterns
          </Link>
          <Link href="/admin" className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest transition hover:text-primary">
            Admin Console
          </Link>
        </div>
      </div>
    </footer>
  );
}