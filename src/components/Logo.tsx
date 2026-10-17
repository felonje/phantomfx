import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-white">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-sm shadow-glow">P</span>
      <span className={compact ? "hidden sm:inline" : ""}>
        Phantom<span className="text-brand-400">FX</span>
      </span>
    </Link>
  );
}
