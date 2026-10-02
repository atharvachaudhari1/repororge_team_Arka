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

  it("identifies designated admin emails for multi-portal access", () => {
    const adminList = getAdminEmails();
    expect(adminList).toContain("fernandesallan745@gmail.com");

    expect(isUserAdmin({ email: "fernandesallan745@gmail.com" })).toBe(true);
    expect(isUserAdmin({ email: "regular_user@example.com", isAdmin: false })).toBe(false);
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

  it("logs out user and invalidates session token", async () => {
    const logout = await logoutAccountHandler({ token: sessionToken });
    expect(logout.ok).toBe(true);

    const check = await readSessionHandler({ token: sessionToken });
    expect(check.user).toBeNull();
  });
});
