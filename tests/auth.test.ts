import { describe, it, expect } from "vitest";
import {
  registerAccountHandler,
  loginAccountHandler,
  readSessionHandler,
  logoutAccountHandler,
  getDatabaseStatusHandler,
  hashResetToken,
  isUserAdmin,
  getAdminEmails,
  saveUserProfileHandler,
  getUserProfileHandler,
  verifyEmailHandler,
  beginPasskeyLoginHandler,
} from "@/lib/auth.server";

describe("Authentication & Session Management", () => {
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = "StrongPassword123!";
  let sessionToken: string | undefined;

  it("checks database status successfully", async () => {
    const status = await getDatabaseStatusHandler();
    expect(status.connected).toBe(true);
    expect(["sqlite", "mongodb"]).toContain(status.type);
  });

  it("hashes password reset tokens deterministically with sha256", async () => {
    const token = "sample_reset_token_xyz_123";
    const hash1 = await hashResetToken(token);
    const hash2 = await hashResetToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string
    expect(hash1).not.toBe(token);
  });

  it("requires ADMIN_EMAILS to grant admin access and has no hardcoded fallback", () => {
    const originalAdminEnv = process.env["ADMIN_EMAILS"];
    try {
      delete process.env["ADMIN_EMAILS"];
      expect(getAdminEmails()).toEqual([]);
      expect(isUserAdmin({ email: "admin@example.com" })).toBe(false);

      process.env["ADMIN_EMAILS"] = "admin@example.com, superuser@example.com";
      const adminList = getAdminEmails();
      expect(adminList).toEqual(["admin@example.com", "superuser@example.com"]);
      expect(isUserAdmin({ email: "admin@example.com" })).toBe(true);
      expect(isUserAdmin({ email: "superuser@example.com" })).toBe(true);
      expect(isUserAdmin({ email: "regular_user@example.com", isAdmin: false })).toBe(false);
    } finally {
      if (originalAdminEnv !== undefined) {
        process.env["ADMIN_EMAILS"] = originalAdminEnv;
      } else {
        delete process.env["ADMIN_EMAILS"];
      }
    }
  });

  it("enforces email verification when REQUIRE_EMAIL_VERIFICATION is enabled", async () => {
    const originalVerEnv = process.env["REQUIRE_EMAIL_VERIFICATION"];
    try {
      process.env["REQUIRE_EMAIL_VERIFICATION"] = "true";
      const unverifiedEmail = `unverified_${Date.now()}@example.com`;

      const reg = await registerAccountHandler({
        fullName: "Unverified User",
        email: unverifiedEmail,
        password: "Password123!",
        role: "candidate",
      });

      expect(reg.ok).toBe(true);
      expect(reg.requiresVerification).toBe(true);

      const loginBlocked = await loginAccountHandler({
        email: unverifiedEmail,
        password: "Password123!",
        role: "candidate",
      });

      expect(loginBlocked.ok).toBe(false);
      expect(loginBlocked.requiresVerification).toBe(true);
      expect(loginBlocked.error).toMatch(/verification is required/i);

      const invalidCode = await verifyEmailHandler({
        email: unverifiedEmail,
        code: "000000",
      });
      expect(invalidCode.ok).toBe(false);
      expect(invalidCode.error).toMatch(/invalid or expired/i);
    } finally {
      if (originalVerEnv !== undefined) {
        process.env["REQUIRE_EMAIL_VERIFICATION"] = originalVerEnv;
      } else {
        delete process.env["REQUIRE_EMAIL_VERIFICATION"];
      }
    }
  });

  it("creates a new user account with hashed credentials", async () => {
    const signup = await registerAccountHandler({
      fullName: "Test Candidate",
      email: testEmail,
      password: testPassword,
      role: "candidate",
    });

    expect(signup.ok).toBe(true);
    expect(signup.user).toBeDefined();
    expect(signup.user?.email).toBe(testEmail.toLowerCase());
    expect(signup.user?.role).toBe("candidate");
    expect(signup.token).toBeDefined();
    sessionToken = signup.token;
  });

  it("prevents duplicate registration with the same email", async () => {
    const duplicate = await registerAccountHandler({
      fullName: "Duplicate User",
      email: testEmail,
      password: testPassword,
      role: "candidate",
    });

    expect(duplicate.ok).toBe(false);
    expect(duplicate.error).toMatch(/already exists/i);
  });

  it("authenticates valid credentials and issues a valid session", async () => {
    const login = await loginAccountHandler({
      email: testEmail,
      password: testPassword,
      role: "candidate",
    });

    expect(login.ok).toBe(true);
    expect(login.user?.email).toBe(testEmail.toLowerCase());
    expect(login.token).toBeDefined();
    sessionToken = login.token;
  });

  it("rejects login with invalid password", async () => {
    const failed = await loginAccountHandler({
      email: testEmail,
      password: "WrongPassword999!",
      role: "candidate",
    });

    expect(failed.ok).toBe(false);
    expect(failed.error).toMatch(/incorrect email, password, or portal/i);
  });

  it("reads and validates an active user session token", async () => {
    const session = await readSessionHandler({ token: sessionToken });
    expect(session.user).not.toBeNull();
    expect(session.user?.email).toBe(testEmail.toLowerCase());
  });

  it("saves and retrieves user profile from database", async () => {
    const profilePayload = {
      fullName: "Test User",
      displayName: "Tester",
      headline: "Accessibility Specialist",
      email: testEmail,
      location: "San Francisco, CA",
      skills: ["WCAG", "React", "TypeScript", "A11y"],
      accommodations: ["screen_reader", "keyboard_navigation"],
      customAccommodation: "Needs captions on video calls",
    };

    const saveResult = await saveUserProfileHandler({
      token: sessionToken,
      profile: profilePayload,
    });

    expect(saveResult.ok).toBe(true);
    expect(saveResult.profile?.headline).toBe("Accessibility Specialist");
    expect(saveResult.profile?.skills).toContain("A11y");

    const fetchResult = await getUserProfileHandler({
      token: sessionToken,
    });

    expect(fetchResult.ok).toBe(true);
    expect(fetchResult.profile?.headline).toBe("Accessibility Specialist");
    expect(fetchResult.profile?.skills).toEqual(profilePayload.skills);
    expect(fetchResult.profile?.accommodations).toContain("screen_reader");
    expect(fetchResult.profile?.customAccommodation).toBe("Needs captions on video calls");
  });

  it("handles biometric passkey login flow: rejects accounts without credentials", async () => {
    const unknownRes = await beginPasskeyLoginHandler({
      email: "nonexistent_biometric_user@example.com",
    });
    expect(unknownRes.ok).toBe(false);
    expect(unknownRes.error).toMatch(/No biometric sign-in is set up/i);
  });

  it("logs out user and invalidates session token", async () => {
    const logout = await logoutAccountHandler({ token: sessionToken });
    expect(logout.ok).toBe(true);

    const check = await readSessionHandler({ token: sessionToken });
    expect(check.user).toBeNull();
  });
});
