import Link from "next/link";
import { Logo } from "@/components/Logo";

export const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME || "PhantomFX";
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@phantomfx.com";

const LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/risk-disclosure", label: "Risk Disclosure" },
];

export function LegalPage({ title, updated, path, children }: { title: string; updated: string; path: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/login" className="text-sm text-slate-400 hover:text-white">Sign in</Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <nav className="segmented mb-8 flex overflow-x-auto text-xs sm:text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-center ${l.href === path ? "bg-ink-700 text-white" : "text-slate-400 hover:text-white"}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {updated}</p>
        <article className="legal mt-8 space-y-6 text-sm leading-relaxed text-slate-300 sm:text-[15px]">{children}</article>
        <p className="mt-12 border-t border-ink-800 pt-6 text-xs text-slate-500">
          Questions about this document? Contact <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-400 hover:underline">{SUPPORT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-2 text-lg font-semibold text-white">{children}</h2>;
}

export function List({ items }: { items: React.ReactNode[] }) {
  return <ul className="list-disc space-y-1.5 pl-5">{items.map((i, n) => <li key={n}>{i}</li>)}</ul>;
}
