export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold tracking-tight ${className}`}>
      <span className="grid grid-cols-3 gap-0.5 rounded-md bg-gradient-to-br from-violet-600 to-fuchsia-600 p-1">
        <span className="h-1.5 w-1.5 rounded-sm bg-white" />
        <span className="h-1.5 w-1.5 rounded-sm bg-white/80" />
        <span className="h-1.5 w-1.5 rounded-sm bg-white" />
        <span className="h-1.5 w-1.5 rounded-sm bg-white/80" />
        <span className="h-1.5 w-1.5 rounded-sm bg-white" />
        <span className="h-1.5 w-1.5 rounded-sm bg-white/80" />
        <span className="h-1.5 w-1.5 rounded-sm bg-white" />
        <span className="h-1.5 w-1.5 rounded-sm bg-white/80" />
        <span className="h-1.5 w-1.5 rounded-sm bg-white" />
      </span>
      <span>
        Tambola<span className="text-violet-500">Zone</span>
      </span>
    </span>
  );
}
