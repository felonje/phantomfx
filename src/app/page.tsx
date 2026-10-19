import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LiveTicker } from "@/components/LiveTicker";
import { HeroQuotes } from "@/components/HeroQuotes";
import { IconBolt, IconCheck, IconLayers, IconPulse, IconReceipt, IconShield, IconWallet } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const features = [
  { icon: IconPulse, title: "Live market prices", body: "Streaming quotes on 10 major and cross currency pairs with real-time candlestick charts." },
  { icon: IconLayers, title: "Demo & live accounts", body: "Practise risk-free with $10,000 virtual funds, then switch to your live account in one tap." },
  { icon: IconBolt, title: "Pro order types", body: "Market, limit and stop orders with stop loss, take profit and up to 1:500 leverage." },
  { icon: IconShield, title: "Risk protection", body: "Automatic margin stop-out at 50% and negative balance protection on every account." },
  { icon: IconWallet, title: "Fast funding", body: "Deposit and withdraw via M-Pesa, bank transfer, card or USDT." },
  { icon: IconReceipt, title: "Transparent pricing", body: "Tight spreads, no hidden fees. Every trade and transaction is in your history." },
];

const stats = [
  { value: "10", label: "Currency pairs" },
  { value: "1:500", label: "Max leverage" },
  { value: "$10k", label: "Free demo funds" },
  { value: "24/5", label: "Market access" },
];

const steps = [
  { title: "Create your account", body: "Sign up in under a minute. Your demo and live accounts are created instantly." },
  { title: "Practise on demo", body: "Learn the terminal with $10,000 in virtual funds and real market prices." },
  { title: "Fund & go live", body: "Deposit via M-Pesa, bank, card or USDT and trade with real money." },
];

export default async function Home() {
  const user = await getCurrentUser();
  const primaryHref = user ? "/trade" : "/register";
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-ink-800/60 bg-ink-950/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#accounts" className="hover:text-white">Accounts</a>
          </nav>
          <div className="flex gap-2 sm:gap-3">
            {user ? (
              <Link href="/trade" className="btn-primary">Open terminal</Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Sign in</Link>
                <Link href="/register" className="btn-primary">
                  Open <span className="hidden sm:inline">account</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_1fr]">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/80 px-3 py-1 text-xs text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-up" /> Live prices · Instant demo account
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Trade the world&apos;s largest market with{" "}
              <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">PhantomFX</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-slate-400 sm:text-lg lg:mx-0">
              Live forex prices, professional order types and risk protection built in. Start practising in seconds — no
              deposit needed.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href={primaryHref} className="btn-primary px-6 py-3 text-base">
                {user ? "Go to terminal" : "Start trading free"}
              </Link>
              {!user && (
                <Link href="/login" className="btn-ghost px-6 py-3 text-base">
                  I have an account
                </Link>
              )}
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500 lg:justify-start">
              {["No deposit for demo", "Negative balance protection", "M-Pesa funding"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <IconCheck className="h-3.5 w-3.5 text-up" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroQuotes />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-700/80 bg-ink-700/60 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-ink-900 px-4 py-5 text-center">
              <div className="font-mono text-2xl font-semibold text-white sm:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-white">Markets</h2>
          <Link href={primaryHref} className="text-sm text-brand-400 hover:underline">Trade now →</Link>
        </div>
        <LiveTicker />
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">Everything you need to trade FX</h2>
          <p className="mt-3 text-slate-400">A full trading terminal, wallet and risk engine — in your browser and on your phone.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card group p-6 transition hover:border-ink-600">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/10 text-brand-400 ring-1 ring-inset ring-brand-500/20 transition group-hover:bg-brand-500/20">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-y border-ink-800 bg-ink-900/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">Start in three steps</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 font-mono text-sm font-semibold text-white shadow-glow">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="accounts" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-white">Two accounts, one login</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <span className="badge bg-brand-500/15 text-brand-300">DEMO</span>
            <div className="mt-4 font-mono text-3xl font-semibold text-white">$10,000</div>
            <div className="text-sm text-slate-500">virtual balance, resettable anytime</div>
            <ul className="mt-6 space-y-2 text-sm text-slate-300">
              {["Real-time market prices", "All order types & leverage", "Reset with one click"].map((t) => (
                <li key={t} className="flex items-center gap-2"><IconCheck className="h-4 w-4 text-brand-400" /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="card relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-up/10 blur-3xl" />
            <span className="badge bg-up/15 text-up">LIVE</span>
            <div className="mt-4 font-mono text-3xl font-semibold text-white">From $10</div>
            <div className="text-sm text-slate-500">minimum deposit</div>
            <ul className="mt-6 space-y-2 text-sm text-slate-300">
              {["M-Pesa, bank, card & USDT", "Stop-out & negative balance protection", "Full trade & ledger history"].map((t) => (
                <li key={t} className="flex items-center gap-2"><IconCheck className="h-4 w-4 text-up" /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-600/30 via-ink-900 to-ink-900 px-6 py-12 text-center sm:px-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to place your first trade?</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-300">Open an account and get $10,000 in demo funds instantly.</p>
          <Link href={primaryHref} className="btn-primary mt-6 px-6 py-3 text-base">
            {user ? "Go to terminal" : "Open free account"}
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink-800 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/risk-disclosure" className="hover:text-white">Risk Disclosure</Link>
          </nav>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} PhantomFX. All rights reserved.</p>
        </div>
        <p className="mx-auto mt-6 max-w-4xl text-center text-xs leading-relaxed text-slate-500">
          Risk warning: Trading leveraged products such as forex carries a high level of risk and may not be suitable for
          all investors. You could lose all of your deposited funds.{" "}
          <Link href="/risk-disclosure" className="text-slate-400 underline-offset-2 hover:underline">Read the full risk disclosure</Link>.
        </p>
      </footer>
    </div>
  );
}
