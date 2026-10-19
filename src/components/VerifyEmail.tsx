"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client/api";
import { AuthShell, FormMessage } from "./AuthShell";

export function VerifyEmail({ token }: { token: string }) {
  const [state, setState] = useState<{ ok?: boolean; error?: string }>(token ? {} : { error: "This verification link is missing its token." });
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    api("/api/auth/verify-email", { body: { token } })
      .then(() => setState({ ok: true }))
      .catch((err: Error) => setState({ error: err.message }));
  }, [token]);

  return (
    <AuthShell>
      <div className="card space-y-4 p-6 text-center sm:p-7">
        <h1 className="text-xl font-semibold text-white">Email verification</h1>
        {state.ok ? (
          <FormMessage>Your email address is verified. Wallet deposits and withdrawals are now enabled.</FormMessage>
        ) : state.error ? (
          <FormMessage error>{state.error} You can request a new link from your account settings.</FormMessage>
        ) : (
          <p className="text-sm text-slate-400">Verifying…</p>
        )}
        <Link href="/trade" className="btn-primary w-full py-2.5">Continue to PhantomFX</Link>
      </div>
    </AuthShell>
  );
}
