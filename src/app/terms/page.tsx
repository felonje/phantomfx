import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, H2, LegalPage, List, SUPPORT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Terms of Service · PhantomFX" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="19 October 2026" path="/terms">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of the PhantomFX website, trading platform and related services
        (the &quot;Services&quot;) operated by {COMPANY} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By creating an account or using the Services you agree to these
        Terms, our <Link href="/privacy" className="text-brand-400 hover:underline">Privacy Policy</Link> and our{" "}
        <Link href="/risk-disclosure" className="text-brand-400 hover:underline">Risk Disclosure</Link>. If you do not agree, do not use the Services.
      </p>

      <H2>1. Eligibility</H2>
      <List
        items={[
          "You must be at least 18 years old and have full legal capacity to enter into a binding agreement.",
          "You must not be a resident of a jurisdiction where offering or using leveraged foreign exchange or CFD products is prohibited or requires a licence we do not hold.",
          "You are responsible for ensuring that your use of the Services complies with the laws that apply to you.",
        ]}
      />

      <H2>2. Your account</H2>
      <List
        items={[
          "You must provide accurate, current and complete information and keep it up to date.",
          "Each person may hold one client profile. Each profile includes a demo account (virtual funds) and a live account (real funds).",
          "You are responsible for keeping your password and two-factor authentication device secure and for all activity under your account. Notify us immediately of any unauthorised use.",
          "We may require identity verification (KYC) before you can deposit, trade on a live account or withdraw, and may request additional documents at any time.",
        ]}
      />

      <H2>3. Nature of the Services</H2>
      <p>
        We provide an online platform for trading over-the-counter leveraged contracts referenced to foreign exchange rates. We act as the
        counterparty to your trades (principal execution); we are not an exchange and your orders are not routed to an exchange. Prices shown on the
        platform are derived from third-party market data plus our spread and may differ from prices quoted elsewhere.
      </p>
      <p>
        We do not provide investment, legal or tax advice. Any market information on the platform is general and does not take into account your
        objectives or financial situation.
      </p>

      <H2>4. Orders and execution</H2>
      <List
        items={[
          "Market orders are filled at the prevailing platform price when received. Pending orders (limit and stop) are triggered when the platform price reaches the order price and may be filled at a worse price during fast markets or gaps (slippage).",
          "Trading is only available during market hours (generally Sunday 22:00 to Friday 22:00 UTC) unless stated otherwise.",
          "We may reject, cancel or reverse trades executed at prices that are manifestly erroneous due to a pricing error, system malfunction or abuse of the platform.",
          "Stop-loss and take-profit orders are not guaranteed and may be executed at a price worse than specified.",
        ]}
      />

      <H2>5. Margin, leverage and stop-out</H2>
      <p>
        Leverage allows you to open positions larger than your deposit, which magnifies both profits and losses. You must maintain enough equity to
        cover the margin required for your open positions. If your margin level (equity ÷ used margin) falls to or below the stop-out level shown on
        the platform (currently 50%), we may close some or all of your positions automatically, starting with the position with the largest loss,
        without prior notice.
      </p>

      <H2>6. Deposits and withdrawals</H2>
      <List
        items={[
          "Deposits are credited after we confirm receipt of cleared funds. Funds must come from a payment account in your own name; third-party payments may be refunded.",
          "Withdrawals are paid to a payment account in your name, after review, and only from available funds (balance not used as margin). We may require verification before processing.",
          "We may charge or pass on fees disclosed on the platform. You are responsible for any fees charged by your bank or payment provider.",
          "We may delay, refuse or reverse a transaction where required by law, for anti-money-laundering reasons, or where we suspect fraud.",
        ]}
      />

      <H2>7. Demo accounts</H2>
      <p>
        Demo accounts use virtual funds with no monetary value. Demo results do not reflect real trading conditions such as slippage, liquidity and
        emotional pressure, and are not indicative of future live results. Virtual funds cannot be withdrawn or transferred to a live account.
      </p>

      <H2>8. Prohibited conduct</H2>
      <List
        items={[
          "Exploiting pricing errors, latency or platform faults, or using any arbitrage, automated or manipulative strategy intended to abuse the platform.",
          "Opening multiple accounts, sharing your account, or trading on behalf of others without our written consent.",
          "Money laundering, terrorist financing, fraud or using the Services for any unlawful purpose.",
          "Attempting to interfere with, reverse engineer or gain unauthorised access to the Services.",
        ]}
      />

      <H2>9. Suspension and termination</H2>
      <p>
        You may close your account at any time once you have no open positions, by contacting support. We may suspend or close your account,
        close open positions and/or withhold funds subject to investigation if you breach these Terms, if required by law or a regulator, or if we
        reasonably suspect fraud or abuse. On closure we will return any remaining balance to you, less amounts you owe us.
      </p>

      <H2>10. Platform availability</H2>
      <p>
        We aim to keep the Services available but do not guarantee uninterrupted or error-free operation. We are not liable for losses caused by
        system outages, internet failures, third-party data or payment providers, or events beyond our reasonable control.
      </p>

      <H2>11. Limitation of liability</H2>
      <p>
        To the maximum extent permitted by law, we are not liable for any indirect, incidental or consequential loss, or for loss of profit or
        opportunity, arising from your use of the Services. Our total liability to you for any claim is limited to the amount of fees and spreads
        you paid to us in the three months before the claim arose. Nothing in these Terms limits liability that cannot be limited by law.
      </p>

      <H2>12. Complaints</H2>
      <p>
        If you have a complaint, email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-400 hover:underline">{SUPPORT_EMAIL}</a> with your account number and details. We will acknowledge it
        within 2 business days and aim to resolve it within 15 business days.
      </p>

      <H2>13. Changes</H2>
      <p>
        We may update these Terms from time to time. Material changes will be notified by email or on the platform at least 14 days before they
        take effect, unless a change is required sooner by law. Continued use after that date means you accept the updated Terms.
      </p>

      <H2>14. Governing law</H2>
      <p>
        These Terms are governed by the laws of the jurisdiction in which {COMPANY} is incorporated, and disputes are subject to the exclusive
        jurisdiction of its courts, unless mandatory consumer protection law where you live provides otherwise.
      </p>
    </LegalPage>
  );
}
