"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { AuthShell, FormMessage } from "./AuthShell";

type LoginResult = { role?: string; twoFactor?: boolean; ticket?: string };

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [useRecovery, setUseRecovery] = useState(false);

  const finish = (res: LoginResult) => {
    router.push(res.role === "ADMIN" ? "/admin" : "/trade");
    router.refresh();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      if (ticket) {
        finish(await api<LoginResult>("/api/auth/login/2fa", { body: { ticket, code: form.code } }));
        return;
      }
      if (mode === "register" && form.password !== form.confirm) throw new Error("Passwords do not match");
      const { confirm: _confirm, acceptTerms, ...rest } = form;
      void _confirm;
      const body = mode === "register" ? { ...rest, acceptTerms: acceptTerms === "on" } : rest;
      const res = await api<LoginResult>(`/api/auth/${mode}`, { body });
      if (res.twoFactor && res.ticket) {
        setTicket(res.ticket);
        setLoading(false);
        return;
      }
      finish(res);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  if (ticket) {
    return (
      <AuthShell footer={<button className="text-brand-400 hover:underline" onClick={() => { setTicket(null); setError(null); }}>Back to sign in</button>}>
        <form onSubmit={onSubmit} className="card space-y-4 p-6 sm:p-7">
          <div>
            <h1 className="text-xl font-semibold text-white">Two-factor authentication</h1>
            <p className="mt-1 text-sm text-slate-400">
              {useRecovery ? "Enter one of your saved recovery codes." : "Enter the 6-digit code from your authenticator app."}
            </p>
          </div>
          <div>
            <label className="label" htmlFor="code">{useRecovery ? "Recovery code" : "Authentication code"}</label>
            <input
              key={useRecovery ? "r" : "t"}
              className="input text-center font-mono text-lg tracking-[0.3em]"
              id="code"
              name="code"
              required
              autoFocus
              autoComplete="one-time-code"
              inputMode={useRecovery ? "text" : "numeric"}
              placeholder={useRecovery ? "xxxxx-xxxxx" : "123456"}
              maxLength={useRecovery ? 20 : 6}
            />
          </div>
          {error && <FormMessage error>{error}</FormMessage>}
          <button className="btn-primary w-full py-2.5" disabled={loading}>{loading ? "Verifying…" : "Verify"}</button>
          <button type="button" className="w-full text-center text-xs text-slate-400 hover:text-white" onClick={() => setUseRecovery((v) => !v)}>
            {useRecovery ? "Use authenticator code instead" : "Lost your device? Use a recovery code"}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      footer={
        mode === "login" ? (
          <>New here? <Link href="/register" className="text-brand-400 hover:underline">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="text-brand-400 hover:underline">Sign in</Link></>
        )
      }
    >
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
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Password</label>
            {mode === "login" && <Link href="/forgot-password" className="mb-1 text-xs text-brand-400 hover:underline">Forgot password?</Link>}
          </div>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : 1}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "register" && <p className="mt-1 text-[11px] text-slate-500">At least 8 characters, with letters and numbers.</p>}
        </div>
        {mode === "register" && (
          <>
            <div>
              <label className="label" htmlFor="confirm">Confirm password</label>
              <input className="input" id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
              <input type="checkbox" name="acceptTerms" required className="mt-0.5 accent-brand-500" />
              <span>
                I am 18 or older and agree to the <Link href="/terms" target="_blank" className="text-brand-400 hover:underline">Terms</Link>,{" "}
                <Link href="/privacy" target="_blank" className="text-brand-400 hover:underline">Privacy Policy</Link> and{" "}
                <Link href="/risk-disclosure" target="_blank" className="text-brand-400 hover:underline">Risk Disclosure</Link>.
              </span>
            </label>
          </>
        )}
        {error && <FormMessage error>{error}</FormMessage>}
        <button className="btn-primary w-full py-2.5" disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
