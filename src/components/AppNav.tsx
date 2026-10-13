"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import { Logo } from "./Logo";

export function AppNav({ user }: { user: { name: string; email: string; role: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = [
    { href: "/trade", label: "Trade" },
    { href: "/wallet", label: "Wallet" },
    { href: "/history", label: "History" },
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };
  return (
    <header className="flex h-12 items-center justify-between border-b border-ink-700 bg-ink-900 px-4">
      <div className="flex items-center gap-6">
        <Logo />
        <nav className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded px-3 py-1.5 text-sm ${pathname.startsWith(l.href) ? "bg-ink-700 text-white" : "text-slate-400 hover:text-white"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden text-slate-400 sm:inline">{user.email}</span>
        <button onClick={logout} className="btn-ghost px-3 py-1 text-xs">
          Log out
        </button>
      </div>
    </header>
  );
}
