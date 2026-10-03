import { describe, expect, it } from "vitest";
import {
  hasBiometricCredentialsHandler,
  generateBiometricAuthOptionsHandler,
  generateBiometricRegistrationOptionsHandler,
  myBiometricStatusHandler,
} from "../src/lib/webauthn.server";

describe("WebAuthn / Biometrics Authentication", () => {
  it("reports no biometric credentials for non-existent user", async () => {
    const res = await hasBiometricCredentialsHandler({ email: "nonexistent@example.com" });
    expect(res.ok).toBe(true);
    expect(res.hasBiometrics).toBe(false);
  });

  it("fails biometric auth challenge when user or credentials do not exist", async () => {
    const res = await generateBiometricAuthOptionsHandler({
      email: "unknown-user@example.com",
      role: "candidate",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("rejects biometric registration options when unauthenticated", async () => {
    const res = await generateBiometricRegistrationOptionsHandler();
    expect(res.ok).toBe(false);
    expect(res.error).toContain("signed in");
  });

  it("rejects myBiometricStatus query when unauthenticated", async () => {
    const res = await myBiometricStatusHandler();
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Not signed in");
  });
});
