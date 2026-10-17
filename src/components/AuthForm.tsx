"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { Logo } from "./Logo";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      if (mode === "register" && form.password !== form.confirm) throw new Error("Passwords do not match");
      const { confirm: _confirm, ...body } = form;
      void _confirm;
      const res = await api<{ role?: string }>(`/api/auth/${mode}`, { body });
      router.push(res.role === "ADMIN" ? "/admin" : "/trade");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <form onSubmit={onSubmit} className="card space-y-4 p-6 sm:p-7">
          <div>
            <h1 className="text-xl font-semibold text-white">{mode === "login" ? "Welcome back" : "Open a trading account"}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {mode === "login" ? "Sign in to your PhantomFX account" : "Get a $10,000 demo account instantly"}
            </p>
          </div>
          {mode === "register" && (
            <>
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input className="input" id="name" name="name" required minLength={2} autoComplete="name" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="phone">Phone</label>
                  <input className="input" id="phone" name="phone" placeholder="+254..." autoComplete="tel" />
                </div>
                <div>
                  <label className="label" htmlFor="country">Country</label>
                  <input className="input" id="country" name="country" placeholder="Kenya" autoComplete="country-name" />
                </div>
              </div>
            </>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === "register" ? 8 : 1}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
          {mode === "register" && (
            <div>
              <label className="label" htmlFor="confirm">Confirm password</label>
              <input className="input" id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
            </div>
          )}
          {error && <p className="rounded bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}
          <button className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
          {mode === "register" && (
            <p className="text-xs text-slate-500">
              You get a demo account with $10,000 virtual funds and a live account you can fund from the wallet.
            </p>
          )}
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          {mode === "login" ? (
            <>New here? <Link href="/register" className="text-brand-400 hover:underline">Create an account</Link></>
          ) : (
            <>Already have an account? <Link href="/login" className="text-brand-400 hover:underline">Sign in</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
