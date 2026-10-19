import type { Metadata } from "next";
import { COMPANY, H2, LegalPage, List } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Risk Disclosure · PhantomFX" };

export default function RiskDisclosurePage() {
  return (
    <LegalPage title="Risk Disclosure" updated="19 October 2026" path="/risk-disclosure">
      <div className="rounded-lg border border-down/30 bg-down/10 p-4 text-slate-200">
        <strong className="text-white">High risk warning:</strong> Trading leveraged foreign exchange contracts carries a high level of risk and may
        not be suitable for all investors. You can lose all of the money you deposit. Only trade with money you can afford to lose, and make sure
        you fully understand the risks involved.
      </div>

      <H2>1. Leverage</H2>
      <p>
        Leverage means a small price movement can have a large effect on your account. For example, with 1:100 leverage a 1% move against your
        position can wipe out 100% of the margin used for it. Higher leverage increases both potential profits and potential losses.
      </p>

      <H2>2. Margin calls and stop-out</H2>
      <p>
        You must keep enough equity in your account to support your open positions. If your margin level falls to the stop-out level (currently 50%),
        positions will be closed automatically at the prevailing price, which may result in a substantial or total loss of your deposited funds.
      </p>

      <H2>3. Market volatility and gaps</H2>
      <p>
        Currency prices can move rapidly due to economic data, central bank decisions, political events or low liquidity. Prices may
        &quot;gap&quot; — for example over a weekend or around news — so that stop-loss, take-profit and pending orders are executed at a significantly worse
        price than requested. Stop-loss orders do not guarantee a limit on losses.
      </p>

      <H2>4. Counterparty and execution risk</H2>
      <p>
        {COMPANY} is the counterparty to your trades. Your trades are not executed on a regulated exchange, and prices are set by us based on
        third-party market data plus a spread. This creates a potential conflict of interest, which we manage through automated execution and
        internal controls. You are exposed to the risk that we are unable to meet our obligations to you.
      </p>

      <H2>5. Technology risk</H2>
      <p>
        Trading over the internet involves risks including connectivity failures, platform outages, delayed or inaccurate data, and unauthorised
        access to your account. You may be unable to open, modify or close positions during such events. Keep your credentials secure and enable
        two-factor authentication.
      </p>

      <H2>6. Costs</H2>
      <p>
        You pay the spread (the difference between the buy and sell price) on every trade, and may pay commissions or other fees shown on the
        platform. Frequent trading increases costs and makes it harder to be profitable.
      </p>

      <H2>7. Currency risk</H2>
      <p>
        Your account is denominated in US dollars. If you deposit or withdraw in another currency, exchange-rate movements and conversion fees will
        affect the value of your funds.
      </p>

      <H2>8. Past performance and demo trading</H2>
      <p>
        Past performance is not a reliable indicator of future results. Results on a demo account use virtual funds and do not reflect real
        conditions such as slippage, liquidity and the psychological pressure of trading real money.
      </p>

      <H2>9. No advice</H2>
      <p>
        We do not provide personal investment advice. Any analysis, prices or commentary on the platform are for information only. Consider seeking
        independent financial advice before trading.
      </p>

      <H2>10. Before you trade</H2>
      <List
        items={[
          "Make sure you understand how leverage, margin and stop-out work.",
          "Practise on the demo account first.",
          "Decide in advance how much you are prepared to lose and use stop-loss orders.",
          "Never trade with borrowed money or funds you need for essential expenses.",
        ]}
      />
    </LegalPage>
  );
}
