"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import { IconChart, IconHistory, IconLogout, IconShield, IconUser, IconWallet } from "./icons";
import { Logo } from "./Logo";

export function AppNav({ user }: { user: { name: string; email: string; role: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = [
    { href: "/trade", label: "Trade", icon: IconChart },
    { href: "/wallet", label: "Wallet", icon: IconWallet },
    { href: "/history", label: "History", icon: IconHistory },
    { href: "/settings", label: "Account", icon: IconUser },
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin", icon: IconShield }] : []),
  ];
  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };
  const initials = user.name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-ink-700 bg-ink-900/90 px-3 backdrop-blur sm:px-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden gap-1 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${pathname.startsWith(l.href) ? "bg-ink-700 text-white" : "text-slate-400 hover:bg-ink-800 hover:text-white"}`}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-xs font-medium text-slate-200">{user.name}</div>
            <div className="text-[11px] text-slate-500">{user.email}</div>
          </div>
          <Link
            href="/settings"
            title="Account & security"
            className="grid h-8 w-8 place-items-center rounded-full bg-ink-700 text-xs font-semibold text-slate-200 ring-1 ring-ink-600 transition hover:ring-brand-500"
          >
            {initials || "U"}
          </Link>
          <button onClick={logout} className="btn-ghost h-8 px-2.5 py-0 text-xs" aria-label="Log out" title="Log out">
            <IconLogout className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-ink-700 bg-ink-900/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${active ? "text-brand-400" : "text-slate-500 hover:text-slate-300"}`}
              >
                <l.icon className="h-5 w-5" />
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
