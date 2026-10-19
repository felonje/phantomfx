import nodemailer, { type Transporter } from "nodemailer";

let transport: Transporter | null | undefined;

function getTransport() {
  if (transport === undefined) transport = process.env.SMTP_URL ? nodemailer.createTransport(process.env.SMTP_URL) : null;
  return transport;
}

export const appUrl = (path = "") => `${(process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")}${path}`;

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function layout(heading: string, paragraphs: string[], action?: { label: string; url: string }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;color:#cbd5e1;line-height:1.6">${escape(p)}</p>`).join("");
  const button = action
    ? `<p style="margin:22px 0"><a href="${escape(action.url)}" style="background:#3b82f6;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escape(action.label)}</a></p><p style="margin:0;color:#64748b;font-size:12px;word-break:break-all">${escape(action.url)}</p>`
    : "";
  return `<div style="background:#060a12;padding:32px 16px;font-family:system-ui,-apple-system,Segoe UI,sans-serif"><div style="max-width:480px;margin:0 auto;background:#0d1422;border:1px solid #1e293b;border-radius:12px;padding:28px"><div style="color:#fff;font-weight:700;font-size:18px;margin-bottom:18px">PhantomFX</div><h1 style="color:#fff;font-size:20px;margin:0 0 14px">${escape(heading)}</h1>${body}${button}<p style="margin:24px 0 0;color:#64748b;font-size:12px">If you didn't request this, you can ignore this email or contact support.</p></div></div>`;
}

export async function sendMail(to: string, subject: string, heading: string, paragraphs: string[], action?: { label: string; url: string }) {
  const text = [heading, "", ...paragraphs, ...(action ? ["", `${action.label}: ${action.url}`] : [])].join("\n");
  const t = getTransport();
  if (!t) {
    // Never print one-time links in production logs; set SMTP_URL to deliver mail.
    if (process.env.NODE_ENV === "production") console.warn(`[mail] SMTP_URL not set, dropped "${subject}"`);
    else console.log(`[mail] (SMTP_URL not set, not sent)\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  try {
    await t.sendMail({ from: process.env.MAIL_FROM || "PhantomFX <no-reply@phantomfx.local>", to, subject, text, html: layout(heading, paragraphs, action) });
  } catch (err) {
    console.error("[mail] send failed:", (err as Error).message);
  }
}

export const mail = {
  verifyEmail: (to: string, name: string, token: string) =>
    sendMail(to, "Verify your email address", `Welcome, ${name}`, ["Please confirm your email address to activate wallet deposits and withdrawals. This link expires in 24 hours."], {
      label: "Verify email",
      url: appUrl(`/verify-email?token=${token}`),
    }),
  resetPassword: (to: string, token: string) =>
    sendMail(to, "Reset your password", "Reset your password", ["We received a request to reset your PhantomFX password. This link expires in 1 hour and can be used once."], {
      label: "Choose a new password",
      url: appUrl(`/reset-password?token=${token}`),
    }),
  securityNotice: (to: string, what: string) =>
    sendMail(to, `Security alert: ${what}`, "Security alert", [`${what} on your PhantomFX account at ${new Date().toUTCString()}.`, "If this wasn't you, reset your password immediately and contact support."]),
};
