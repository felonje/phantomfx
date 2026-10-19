"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell, FormMessage } from "@/components/AuthShell";
import { api } from "@/lib/client/api";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/api/auth/forgot-password", { body: { email: new FormData(e.currentTarget).get("email") } });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell footer={<Link href="/login" className="text-brand-400 hover:underline">Back to sign in</Link>}>
      <form onSubmit={onSubmit} className="card space-y-4 p-6 sm:p-7">
        <div>
          <h1 className="text-xl font-semibold text-white">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-400">Enter your email and we&apos;ll send you a reset link.</p>
        </div>
        {sent ? (
          <FormMessage>If an account exists for that email, a reset link is on its way. It expires in 1 hour.</FormMessage>
        ) : (
          <>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input className="input" id="email" name="email" type="email" required autoComplete="email" autoFocus />
            </div>
            {error && <FormMessage error>{error}</FormMessage>}
            <button className="btn-primary w-full py-2.5" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</button>
          </>
        )}
      </form>
    </AuthShell>
  );
}
