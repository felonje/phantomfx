import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode, hotp, totp, verifyTotp } from "./totp";

// RFC 6238 SHA-1 test secret "12345678901234567890"
const SECRET = base32Encode(Buffer.from("12345678901234567890"));

describe("totp", () => {
  it("round-trips base32", () => {
    const buf = Buffer.from("hello world!");
    expect(base32Decode(base32Encode(buf)).toString()).toBe("hello world!");
    expect(SECRET).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  });

  it("matches RFC 4226/6238 vectors", () => {
    expect(hotp(Buffer.from("12345678901234567890"), 0)).toBe("755224");
    expect(hotp(Buffer.from("12345678901234567890"), 1, 8)).toBe("94287082");
    expect(totp(SECRET, 59_000)).toBe("287082");
    expect(totp(SECRET, 1_111_111_109_000)).toBe("081804");
  });

  it("verifies within one step of drift only", () => {
    const t = 1_111_111_109_000;
    expect(verifyTotp(SECRET, "081804", t)).toBe(true);
    expect(verifyTotp(SECRET, "081804", t + 30_000)).toBe(true);
    expect(verifyTotp(SECRET, "081804", t + 90_000)).toBe(false);
    expect(verifyTotp(SECRET, "000000", t)).toBe(false);
    expect(verifyTotp(SECRET, "abc", t)).toBe(false);
  });
});
