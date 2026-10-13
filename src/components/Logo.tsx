import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-white">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-500 text-sm">P</span>
      <span>
        Phantom<span className="text-brand-400">FX</span>
      </span>
    </Link>
  );
}
