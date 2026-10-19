import { describe, it, expect } from "vitest";
import {
  createVerification,
  verifyTokenOrCode,
  isUserEmailVerified,
  signVerificationToken,
  isSmtpSetUp,
  getSystemSmtpConfig,
} from "../lib/verification";

describe("Email Verification & SMTP Gate Suite", () => {
  const testUserId = "test-user-verification-123";
  const testEmail = "engineer-test@space.dev";

  it("checks whether system SMTP is configured", async () => {
    const isReady = await isSmtpSetUp();
    expect(typeof isReady).toBe("boolean");
  });

  it("creates verification credentials with 6-digit code and signed JWT", async () => {
    const { token, code, expiresAt } = await createVerification(testUserId, testEmail);

    expect(code).toBeDefined();
    expect(code).toMatch(/^\d{6}$/);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("verifies user using 6-digit numeric verification code", async () => {
    const { code } = await createVerification(testUserId, testEmail);

    const result = await verifyTokenOrCode(code, testEmail);
    expect(result.success).toBe(true);
    expect(result.userId).toBe(testUserId);
    expect(result.email).toBe(testEmail);

    // User should now be verified
    const isVerified = await isUserEmailVerified(testUserId, testEmail);
    expect(isVerified).toBe(true);
  });

  it("verifies user using signed JWT token", async () => {
    const uniqueUserId = "user-jwt-test-456";
    const uniqueEmail = "jwt-user@space.dev";

    const { token } = await createVerification(uniqueUserId, uniqueEmail);

    const result = await verifyTokenOrCode(token);
    expect(result.success).toBe(true);
    expect(result.userId).toBe(uniqueUserId);
    expect(result.email).toBe(uniqueEmail);

    const isVerified = await isUserEmailVerified(uniqueUserId, uniqueEmail);
    expect(isVerified).toBe(true);
  });

  it("rejects invalid verification codes or tokens", async () => {
    const invalidResult = await verifyTokenOrCode("000000", "nonexistent@space.dev");
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toBeDefined();

    const badJwtResult = await verifyTokenOrCode("malformed.jwt.token");
    expect(badJwtResult.success).toBe(false);
  });

  it("considers users without explicit verification records verified by default", async () => {
    const isVerified = await isUserEmailVerified("unknown-user-id", "untracked@space.dev");
    expect(isVerified).toBe(true);
  });
});
