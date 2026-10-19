import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Password must contain letters and numbers");
