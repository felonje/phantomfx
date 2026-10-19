"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { AuthShell, FormMessage } from "./AuthShell";

export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "This reset link is missing its token. Request a new one.");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(null);
    if (f.get("password") !== f.get("confirm")) return setError("Passwords do not match");
    setLoading(true);
    try {
      await api("/api/auth/reset-password", { body: { token, password: f.get("password") } });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell footer={<Link href="/forgot-password" className="text-brand-400 hover:underline">Request a new link</Link>}>
      <form onSubmit={onSubmit} className="card space-y-4 p-6 sm:p-7">
        <h1 className="text-xl font-semibold text-white">Choose a new password</h1>
        {done ? (
          <>
            <FormMessage>Your password has been updated and all devices were signed out.</FormMessage>
            <Link href="/login" className="btn-primary w-full py-2.5">Sign in</Link>
          </>
        ) : (
          <>
            <div>
              <label className="label" htmlFor="password">New password</label>
              <input className="input" id="password" name="password" type="password" required minLength={8} autoComplete="new-password" autoFocus />
              <p className="mt-1 text-[11px] text-slate-500">At least 8 characters, with letters and numbers.</p>
            </div>
            <div>
              <label className="label" htmlFor="confirm">Confirm new password</label>
              <input className="input" id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            {error && <FormMessage error>{error}</FormMessage>}
            <button className="btn-primary w-full py-2.5" disabled={loading || !token}>{loading ? "Saving…" : "Update password"}</button>
          </>
        )}
      </form>
    </AuthShell>
  );
}
