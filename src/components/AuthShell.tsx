import Link from "next/link";
import { Logo } from "./Logo";

export function AuthShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        {children}
        {footer && <div className="mt-4 text-center text-sm text-slate-400">{footer}</div>}
        <div className="mt-6 flex justify-center gap-4 text-xs text-slate-500">
          <Link href="/terms" className="hover:text-slate-300">Terms</Link>
          <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
          <Link href="/risk-disclosure" className="hover:text-slate-300">Risk disclosure</Link>
        </div>
      </div>
    </div>
  );
}

export function FormMessage({ error, children }: { error?: boolean; children: React.ReactNode }) {
  return <p className={`rounded px-3 py-2 text-sm ${error ? "bg-down/10 text-down" : "bg-up/10 text-up"}`}>{children}</p>;
}
