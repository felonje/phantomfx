import type { Metadata } from "next";
import { COMPANY, H2, LegalPage, List, SUPPORT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy · PhantomFX" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="19 October 2026" path="/privacy">
      <p>
        This Privacy Policy explains how {COMPANY} (&quot;we&quot;, &quot;us&quot;) collects, uses, shares and protects personal data when you use the PhantomFX
        website and trading platform. We process personal data in accordance with applicable data protection law, including the Kenya Data
        Protection Act, 2019 and, where it applies, the EU/UK GDPR.
      </p>

      <H2>1. Data we collect</H2>
      <List
        items={[
          <><strong className="text-white">Account data:</strong> name, email address, phone number, country, password (stored only as a salted hash).</>,
          <><strong className="text-white">Verification data:</strong> identity documents, proof of address, date of birth and selfie images where required for KYC/AML checks.</>,
          <><strong className="text-white">Financial and trading data:</strong> deposits, withdrawals, payment references and payout details, balances, orders, positions and trade history.</>,
          <><strong className="text-white">Technical and security data:</strong> IP address, browser and device information, sign-in times, active sessions and security events (such as password changes or 2FA changes).</>,
          <><strong className="text-white">Communications:</strong> messages you send to support and records of emails we send you.</>,
        ]}
      />

      <H2>2. How we use your data</H2>
      <List
        items={[
          "To create and operate your account, execute trades and process deposits and withdrawals (performance of contract).",
          "To verify your identity, prevent fraud, money laundering and terrorist financing, and meet record-keeping and reporting obligations (legal obligation).",
          "To secure the platform, detect suspicious sign-ins and protect your account (legitimate interests).",
          "To send service and security emails such as verification, password reset and security alerts (performance of contract / legitimate interests).",
          "To send marketing only where you have opted in; you can opt out at any time (consent).",
        ]}
      />

      <H2>3. Sharing</H2>
      <p>We do not sell your personal data. We share it only with:</p>
      <List
        items={[
          "Service providers that host our systems, send email, process payments, or perform identity verification, under contracts requiring them to protect your data.",
          "Market data providers (no personal data is shared with them).",
          "Regulators, law enforcement, courts or other authorities where required by law.",
          "A successor entity in the event of a merger, acquisition or sale of assets, subject to this Policy.",
        ]}
      />

      <H2>4. International transfers</H2>
      <p>
        Our providers may process data outside your country. Where this happens we use appropriate safeguards such as contractual clauses and
        transfer only what is necessary.
      </p>

      <H2>5. Retention</H2>
      <p>
        We keep account, verification and transaction records for as long as your account is open and for at least 7 years after it closes (or longer
        if required by law) to meet anti-money-laundering and accounting obligations. Security logs are kept for up to 2 years.
      </p>

      <H2>6. Security</H2>
      <p>
        We protect your data with encryption in transit (HTTPS), hashed passwords, optional two-factor authentication, session controls, access
        restrictions and audit logging. No system is perfectly secure; please use a strong unique password and enable two-factor authentication.
      </p>

      <H2>7. Your rights</H2>
      <p>Subject to legal limits, you may:</p>
      <List
        items={[
          "Access the personal data we hold about you and receive a copy.",
          "Correct inaccurate or incomplete data.",
          "Request deletion of data we are not required to keep by law.",
          "Object to or restrict certain processing, and withdraw consent where processing is based on consent.",
          "Request data portability.",
          "Lodge a complaint with your data protection authority (in Kenya, the Office of the Data Protection Commissioner).",
        ]}
      />
      <p>
        To exercise your rights, email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-400 hover:underline">{SUPPORT_EMAIL}</a>. We may need to verify your identity first.
      </p>

      <H2>8. Cookies</H2>
      <p>
        We use a strictly necessary, http-only session cookie to keep you signed in. We do not use advertising or third-party tracking cookies.
      </p>

      <H2>9. Children</H2>
      <p>The Services are not intended for anyone under 18 and we do not knowingly collect their data.</p>

      <H2>10. Changes</H2>
      <p>We may update this Policy and will notify you of material changes by email or on the platform.</p>
    </LegalPage>
  );
}
