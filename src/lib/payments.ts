export const PAYMENT_METHODS = ["M-Pesa", "Bank transfer", "Card", "USDT (TRC20)"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
