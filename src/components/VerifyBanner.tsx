"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client/api";

export function VerifyBanner() {
  const [state, setState] = useState<"idle" | "sent" | string>("idle");
  const resend = async () => {
    try {
      await api("/api/auth/resend-verification", { method: "POST" });
      setState("sent");
    } catch (err) {
      setState((err as Error).message);
    }
  };
  return (
    <div className="border-b border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-center text-xs text-yellow-200 sm:text-sm">
      Please verify your email to enable deposits and withdrawals.{" "}
      {state === "idle" ? (
        <button onClick={resend} className="font-medium underline underline-offset-2 hover:text-white">Resend email</button>
      ) : state === "sent" ? (
        <span className="font-medium">Sent — check your inbox.</span>
      ) : (
        <span className="text-down">{state}</span>
      )}{" "}
      <Link href="/settings" className="hidden underline-offset-2 hover:underline sm:inline">Account settings</Link>
    </div>
  );
}
