import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LiveTicker } from "@/components/LiveTicker";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const features = [
  { title: "Live market prices", body: "Streaming quotes on 10 major and cross currency pairs with real-time charts." },
  { title: "Demo & live accounts", body: "Practise risk-free with $10,000 virtual funds, then switch to your live account." },
  { title: "Pro order types", body: "Market, limit and stop orders with stop loss, take profit and up to 1:500 leverage." },
  { title: "Risk protection", body: "Automatic margin stop-out at 50% and negative balance protection on every account." },
  { title: "Fast funding", body: "Deposit and withdraw via M-Pesa, bank transfer, card or USDT." },
  { title: "Transparent pricing", body: "Tight spreads, no hidden fees. Every trade and transaction is in your history." },
];

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex gap-3">
          {user ? (
            <Link href="/trade" className="btn-primary">Open terminal</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Sign in</Link>
              <Link href="/register" className="btn-primary">Open account</Link>
            </>
          )}
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-16 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Trade the world&apos;s largest market with <span className="text-brand-400">PhantomFX</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">
          Live forex prices, professional order types and instant demo accounts. Start practising in seconds.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href={user ? "/trade" : "/register"} className="btn-primary px-6 py-3 text-base">
            {user ? "Go to terminal" : "Start trading free"}
          </Link>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6">
        <LiveTicker />
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card p-5">
            <h3 className="font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{f.body}</p>
          </div>
        ))}
      </section>
      <footer className="border-t border-ink-800 px-6 py-8 text-center text-xs text-slate-500">
        Risk warning: Trading leveraged products such as forex carries a high level of risk and may not be suitable for all
        investors. You could lose all of your deposited funds.
      </footer>
    </div>
  );
}
