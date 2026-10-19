"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FormMessage } from "@/components/AuthShell";
import { api } from "@/lib/client/api";
import { dateTime } from "@/lib/client/format";

interface Props {
  user: { name: string; email: string; phone: string | null; country: string | null; emailVerified: boolean; totpEnabled: boolean; createdAt: string };
}

type Msg = { text: string; error?: boolean } | null;

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <h2 className="font-semibold text-white">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-slate-400">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function useAction() {
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<string | void>) => {
    setBusy(true);
    setMsg(null);
    try {
      const text = await fn();
      if (text) setMsg({ text });
    } catch (err) {
      setMsg({ text: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  };
  return { msg, busy, run, setMsg };
}

export function SecuritySettings({ user }: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:space-y-5 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Account &amp; security</h1>
        <p className="text-sm text-slate-400" suppressHydrationWarning>Member since {dateTime(user.createdAt)}</p>
      </div>
      <Profile user={user} />
      <ChangePassword />
      <TwoFactor enabled={user.totpEnabled} />
      <Sessions />
    </div>
  );
}

function Profile({ user }: Props) {
  const a = useAction();
  return (
    <Section title="Profile">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {[["Name", user.name], ["Phone", user.phone ?? "—"], ["Country", user.country ?? "—"]].map(([k, v]) => (
          <div key={k}>
            <dt className="stat-label">{k}</dt>
            <dd className="mt-0.5 text-slate-200">{v}</dd>
          </div>
        ))}
        <div>
          <dt className="stat-label">Email</dt>
          <dd className="mt-0.5 flex flex-wrap items-center gap-2 text-slate-200">
            <span className="break-all">{user.email}</span>
            {user.emailVerified ? (
              <span className="badge bg-up/15 text-up">Verified</span>
            ) : (
              <span className="badge bg-yellow-500/15 text-yellow-400">Unverified</span>
            )}
          </dd>
        </div>
      </dl>
      {!user.emailVerified && (
        <div className="mt-4 space-y-3">
          <button
            className="btn-ghost text-sm"
            disabled={a.busy}
            onClick={() => a.run(async () => { await api("/api/auth/resend-verification", { method: "POST" }); return "Verification email sent. Check your inbox."; })}
          >
            Resend verification email
          </button>
          {a.msg && <FormMessage error={a.msg.error}>{a.msg.text}</FormMessage>}
        </div>
      )}
    </Section>
  );
}

function ChangePassword() {
  const a = useAction();
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    void a.run(async () => {
      if (f.get("newPassword") !== f.get("confirm")) throw new Error("New passwords do not match");
      await api("/api/auth/password", { body: { currentPassword: f.get("currentPassword"), newPassword: f.get("newPassword") } });
      form.reset();
      return "Password updated. Other devices have been signed out.";
    });
  };
  return (
    <Section title="Password" description="Changing your password signs out all other devices.">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="currentPassword">Current password</label>
          <input className="input" id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
        </div>
        <div>
          <label className="label" htmlFor="newPassword">New password</label>
          <input className="input" id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="confirmPw">Confirm new password</label>
          <input className="input" id="confirmPw" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <div className="flex flex-col gap-3 sm:col-span-3 sm:flex-row sm:items-center">
          <button className="btn-primary" disabled={a.busy}>Update password</button>
          {a.msg && <FormMessage error={a.msg.error}>{a.msg.text}</FormMessage>}
        </div>
      </form>
    </Section>
  );
}

function TwoFactor({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const a = useAction();
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [disabling, setDisabling] = useState(false);

  const start = () => a.run(async () => setSetup(await api<{ secret: string; qr: string }>("/api/auth/2fa/setup", { method: "POST" })));

  const confirm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = new FormData(e.currentTarget).get("code");
    void a.run(async () => {
      const res = await api<{ recoveryCodes: string[] }>("/api/auth/2fa/enable", { body: { code } });
      setSetup(null);
      setCodes(res.recoveryCodes);
    });
  };

  const disable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void a.run(async () => {
      await api("/api/auth/2fa/disable", { body: { password: f.get("password"), code: f.get("code") } });
      setDisabling(false);
      router.refresh();
      return "Two-factor authentication disabled.";
    });
  };

  return (
    <Section title="Two-factor authentication" description="Protect your account with a code from an authenticator app such as Google Authenticator, Authy or 1Password.">
      {codes ? (
        <div className="space-y-3">
          <FormMessage>Two-factor authentication is on. Save these recovery codes somewhere safe; each one can be used once if you lose your device.</FormMessage>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-ink-950 p-3 font-mono text-sm text-slate-200 sm:grid-cols-4">
            {codes.map((c) => <span key={c}>{c}</span>)}
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost text-sm" onClick={() => void navigator.clipboard?.writeText(codes.join("\n"))}>Copy codes</button>
            <button className="btn-primary text-sm" onClick={() => { setCodes(null); router.refresh(); }}>I&apos;ve saved them</button>
          </div>
        </div>
      ) : enabled ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm"><span className="badge bg-up/15 text-up">Enabled</span><span className="text-slate-400">A code is required each time you sign in.</span></div>
          {disabling ? (
            <form onSubmit={disable} className="grid gap-3 sm:grid-cols-3">
              <input className="input" name="password" type="password" placeholder="Password" required autoComplete="current-password" />
              <input className="input font-mono" name="code" placeholder="Code or recovery code" required autoComplete="one-time-code" />
              <div className="flex gap-2">
                <button className="btn-sell flex-1" disabled={a.busy}>Disable</button>
                <button type="button" className="btn-ghost" onClick={() => setDisabling(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <button className="btn-ghost text-sm" onClick={() => setDisabling(true)}>Disable two-factor</button>
          )}
        </div>
      ) : setup ? (
        <form onSubmit={confirm} className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qr} alt="2FA QR code" width={180} height={180} className="mx-auto rounded-lg bg-white p-1 sm:mx-0" />
          <div className="flex-1 space-y-3 text-sm">
            <p className="text-slate-300">1. Scan the QR code with your authenticator app, or enter this key manually:</p>
            <code className="block break-all rounded bg-ink-950 px-3 py-2 font-mono text-xs text-slate-200">{setup.secret}</code>
            <p className="text-slate-300">2. Enter the 6-digit code it shows:</p>
            <div className="flex gap-2">
              <input className="input max-w-[10rem] text-center font-mono tracking-[0.3em]" name="code" inputMode="numeric" maxLength={6} required autoComplete="one-time-code" placeholder="123456" />
              <button className="btn-primary" disabled={a.busy}>Turn on</button>
            </div>
          </div>
        </form>
      ) : (
        <button className="btn-primary text-sm" onClick={start} disabled={a.busy}>Set up two-factor</button>
      )}
      {a.msg && <div className="mt-3"><FormMessage error={a.msg.error}>{a.msg.text}</FormMessage></div>}
    </Section>
  );
}

interface SessionRow { id: string; ip: string | null; userAgent: string | null; createdAt: string; lastSeenAt: string; current: boolean }

function describeAgent(ua: string | null) {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

function Sessions() {
  const a = useAction();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const load = useCallback(() => api<{ sessions: SessionRow[] }>("/api/auth/sessions").then((d) => setRows(d.sessions)), []);
  useEffect(() => {
    void load();
  }, [load]);
  const others = rows.filter((r) => !r.current).length;
  return (
    <Section title="Active sessions" description="Devices currently signed in to your account.">
      <ul className="divide-y divide-ink-700">
        {rows.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-slate-200">
                {describeAgent(s.userAgent)}
                {s.current && <span className="badge bg-brand-500/15 text-brand-400">This device</span>}
              </div>
              <div className="truncate text-xs text-slate-500">{s.ip ?? "Unknown IP"} · last active {dateTime(s.lastSeenAt)}</div>
            </div>
            {!s.current && (
              <button
                className="shrink-0 text-xs text-down hover:underline"
                onClick={() => a.run(async () => { await api(`/api/auth/sessions/${s.id}`, { method: "DELETE" }); await load(); })}
              >
                Sign out
              </button>
            )}
          </li>
        ))}
      </ul>
      {others > 0 && (
        <button
          className="btn-ghost mt-3 text-sm"
          disabled={a.busy}
          onClick={() => a.run(async () => { await api("/api/auth/sessions", { method: "DELETE" }); await load(); return "Signed out of all other devices."; })}
        >
          Sign out all other devices
        </button>
      )}
      {a.msg && <div className="mt-3"><FormMessage error={a.msg.error}>{a.msg.text}</FormMessage></div>}
    </Section>
  );
}
