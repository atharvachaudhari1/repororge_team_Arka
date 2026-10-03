import {
  getCookie,
  setCookie,
  deleteCookie,
  getRequestIP,
  getRequestHeader,
} from "@tanstack/react-start/server";
import { ObjectId } from "mongodb";
import type { AccountRole, AuthUser } from "./auth.functions";
import { isMongoConfigured, getMongoDb, checkMongoConnection } from "./mongodb.server";
import { sendPasswordResetEmail, sendEmailVerificationCode } from "./mailer.server";

type UserRow = {
  id: number | string;
  full_name: string;
  email: string;
  role: AccountRole;
  password_hash: string;
  password_salt: string;
  email_verified?: number | boolean;
};

type SqliteDatabase = import("better-sqlite3").Database;
let databasePromise: Promise<SqliteDatabase> | undefined;

export async function getDatabase(): Promise<SqliteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const [sqliteModule, fsModule, pathModule] = await Promise.all([
        import("better-sqlite3"),
        import("node:fs"),
        import("node:path"),
      ]);
      const databasePath =
        process.env["ABLEO_AUTH_DB"] ?? pathModule.join(process.cwd(), "data", "ableo-auth.sqlite");
      fsModule.mkdirSync(pathModule.dirname(databasePath), { recursive: true });
      const db = new sqliteModule.default(databasePath);
      db.pragma("journal_mode = WAL");
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE COLLATE NOCASE,
          role TEXT NOT NULL CHECK (role IN ('candidate', 'employer')),
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          email_verified INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS login_attempts (
          key TEXT PRIMARY KEY,
          attempts INTEGER NOT NULL DEFAULT 1,
          lock_until TEXT,
          last_attempt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS password_resets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL COLLATE NOCASE,
          token TEXT NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          used_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS email_verifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL COLLATE NOCASE,
          code TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ai_rate_limits (
          key TEXT PRIMARY KEY,
          count INTEGER NOT NULL DEFAULT 1,
          window_start TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS profiles (
          email TEXT PRIMARY KEY COLLATE NOCASE,
          profile_data TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Passkeys contain only public WebAuthn credentials. Biometric templates
        -- never leave the user's authenticator or get stored by Ableo.
        CREATE TABLE IF NOT EXISTS passkeys (
          credential_id TEXT PRIMARY KEY,
          email TEXT NOT NULL COLLATE NOCASE,
          public_key TEXT NOT NULL,
          counter INTEGER NOT NULL DEFAULT 0,
          transports TEXT NOT NULL DEFAULT '[]',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS webauthn_challenges (
          email TEXT NOT NULL COLLATE NOCASE,
          purpose TEXT NOT NULL CHECK (purpose IN ('registration', 'authentication')),
          challenge TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          PRIMARY KEY (email, purpose)
        );
      `);

      try {
        db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0");
      } catch {
        // column already exists
      }

      return db;
    })();
  }
  return databasePromise;
}

async function crypto() {
  return import("node:crypto");
}

function publicUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    emailVerified: Boolean(row.email_verified),
  };
}

async function passwordHash(password: string, salt: string) {
  return (await crypto()).scryptSync(password, salt, 64).toString("hex");
}

export function getAdminEmails(): string[] {
  const envAdmins = process.env["ADMIN_EMAILS"] || "";
  return envAdmins
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isUserAdmin(userDoc?: Record<string, unknown> | UserRow | null): boolean {
  if (!userDoc) return false;
  const doc = userDoc as Record<string, unknown>;
  if (doc["isAdmin"] === true || doc["is_admin"] === 1 || doc["is_admin"] === true) {
    return true;
  }
  if (doc["role"] === "admin") {
    return true;
  }
  const email = String(doc["email"] || "")
    .toLowerCase()
    .trim();
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.length > 0 && adminEmails.includes(email);
}

export function isEmailVerificationRequired(): boolean {
  const val = process.env["REQUIRE_EMAIL_VERIFICATION"];
  return val === "true" || val === "1";
}

export async function hashResetToken(token: string): Promise<string> {
  return (await crypto()).createHash("sha256").update(token.trim()).digest("hex");
}

async function createSession(
  dbOrMongo: SqliteDatabase | "mongo",
  userId: number | string,
  role?: AccountRole,
  rememberMe: boolean = true,
) {
  const token = (await crypto()).randomBytes(32).toString("hex");
  const durationMs = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 24 * 60 * 60 * 1000; // 1 day
  const expiresAt = new Date(Date.now() + durationMs);

  if (dbOrMongo === "mongo") {
    const mongo = await getMongoDb();
    await mongo.collection("sessions").deleteMany({ expiresAt: { $lte: new Date() } });
    await mongo.collection("sessions").insertOne({
      token,
      userId: userId.toString(),
      role: role || undefined,
      expiresAt,
      createdAt: new Date(),
    });
  } else {
    dbOrMongo.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
    dbOrMongo
      .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
      .run(token, userId, expiresAt.toISOString());
  }

  return token;
}

const COOKIE_NAME = "ableo_session";

export function setSessionCookie(token: string, rememberMe: boolean = true) {
  try {
    const maxAge = rememberMe
      ? 30 * 24 * 60 * 60 // 30 days in seconds
      : 24 * 60 * 60; // 1 day in seconds
    setCookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
  } catch (err) {
    console.error("Could not set session cookie:", err);
  }
}

export function clearSessionCookie() {
  try {
    deleteCookie(COOKIE_NAME, {
      path: "/",
    });
  } catch (err) {
    console.error("Could not clear session cookie:", err);
  }
}

export function getSessionCookieToken(): string | null {
  try {
    const val = getCookie(COOKIE_NAME);
    return typeof val === "string" ? val : null;
  } catch {
    return null;
  }
}

function webAuthnOrigins(clientOrigin?: string): string[] {
  const customOrigins = process.env["WEBAUTHN_ORIGIN"]
    ? process.env["WEBAUTHN_ORIGIN"].split(",").map((o) => o.trim())
    : [];

  const defaults = [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
    "https://localhost:8080",
    "https://localhost:8081",
    "https://localhost:3000",
    "https://localhost:5173",
  ];

  if (process.env["APP_URL"]) {
    defaults.push(process.env["APP_URL"]);
  }

  try {
    const reqOrigin = getRequestHeader("origin");
    if (reqOrigin && !defaults.includes(reqOrigin)) {
      defaults.push(reqOrigin);
    }
    const host = getRequestHeader("host");
    if (host) {
      defaults.push(`http://${host}`);
      defaults.push(`https://${host}`);
    }
  } catch {
    // not in request context
  }

  if (clientOrigin && !defaults.includes(clientOrigin)) {
    defaults.push(clientOrigin);
  }

  return Array.from(new Set([...customOrigins, ...defaults]));
}

function webAuthnRp() {
  const origin =
    process.env["WEBAUTHN_ORIGIN"] || getRequestHeader("origin") || process.env["APP_URL"] || "http://localhost:8080";
  try {
    const url = new URL(origin);
    return { origin: url.origin, rpID: process.env["WEBAUTHN_RP_ID"] || url.hostname };
  } catch {
    return { origin: "http://localhost:8080", rpID: process.env["WEBAUTHN_RP_ID"] || "localhost" };
  }
}

async function saveWebAuthnChallenge(
  email: string,
  purpose: "registration" | "authentication",
  challenge: string,
) {
  const db = await getDatabase();
  db.prepare("DELETE FROM webauthn_challenges WHERE email = ? AND purpose = ?").run(email, purpose);
  db.prepare(
    "INSERT INTO webauthn_challenges (email, purpose, challenge, expires_at) VALUES (?, ?, ?, ?)",
  ).run(email, purpose, challenge, new Date(Date.now() + 5 * 60_000).toISOString());
}

async function consumeWebAuthnChallenge(email: string, purpose: "registration" | "authentication") {
  const db = await getDatabase();
  const row = db
    .prepare(
      "SELECT challenge FROM webauthn_challenges WHERE email = ? AND purpose = ? AND expires_at > ?",
    )
    .get(email, purpose, new Date().toISOString()) as { challenge: string } | undefined;
  db.prepare("DELETE FROM webauthn_challenges WHERE email = ? AND purpose = ?").run(email, purpose);
  return row?.challenge;
}

export async function beginPasskeyRegistrationHandler() {
  const session = await readSessionHandler({});
  if (!session.user) return { ok: false as const, error: "Sign in before adding a passkey." };
  const { generateRegistrationOptions } = await import("@simplewebauthn/server");
  const db = await getDatabase();
  const existing = db
    .prepare("SELECT credential_id, transports FROM passkeys WHERE email = ?")
    .all(session.user.email) as { credential_id: string; transports: string }[];
  try {
    const webCreds = db
      .prepare(`
        SELECT c.credential_id, c.transports
        FROM webauthn_credentials c
        JOIN users u ON u.id = c.user_id
        WHERE lower(trim(u.email)) = ?
      `)
      .all(session.user.email.toLowerCase().trim()) as { credential_id: string; transports: string }[];
    for (const wc of webCreds) {
      if (!existing.some((e) => e.credential_id === wc.credential_id)) {
        existing.push(wc);
      }
    }
  } catch {}

  const rp = webAuthnRp();
  const options = await generateRegistrationOptions({
    rpName: "Ableo",
    rpID: rp.rpID,
    timeout: 120_000,
    userName: session.user.email,
    userID: new TextEncoder().encode(String(session.user.id)),
    userDisplayName: session.user.fullName,
    attestationType: "none",
    excludeCredentials: existing.map((item) => ({
      id: item.credential_id,
      transports: item.transports ? JSON.parse(item.transports) : undefined,
    })),
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });
  await saveWebAuthnChallenge(session.user.email, "registration", options.challenge);
  return { ok: true as const, options };
}

export async function finishPasskeyRegistrationHandler(data: { response: unknown }) {
  const session = await readSessionHandler({});
  if (!session.user) return { ok: false as const, error: "Your session has expired." };
  const challenge = await consumeWebAuthnChallenge(session.user.email, "registration");
  if (!challenge) return { ok: false as const, error: "Passkey setup expired. Try again." };
  const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
  const rp = webAuthnRp();

  let clientOrigin: string | undefined;
  try {
    const respObj = data.response as { response?: { clientDataJSON?: string } };
    if (respObj?.response?.clientDataJSON) {
      const clientDataBuffer = Buffer.from(respObj.response.clientDataJSON, "base64url");
      const clientData = JSON.parse(clientDataBuffer.toString("utf-8"));
      if (typeof clientData.origin === "string") clientOrigin = clientData.origin;
    }
  } catch {}

  const verification = await verifyRegistrationResponse({
    response: data.response as never,
    expectedChallenge: challenge,
    expectedOrigin: webAuthnOrigins(clientOrigin),
    expectedRPID: rp.rpID,
    requireUserVerification: false,
  });
  if (!verification.verified || !verification.registrationInfo)
    return { ok: false as const, error: "Passkey verification failed." };
  const credential = verification.registrationInfo.credential;
  const db = await getDatabase();
  const b64urlKey = Buffer.from(credential.publicKey).toString("base64url");
  const b64Key = Buffer.from(credential.publicKey).toString("base64");
  const transportsJson = JSON.stringify(credential.transports ?? []);

  db.prepare(
    "INSERT OR REPLACE INTO passkeys (credential_id, email, public_key, counter, transports) VALUES (?, ?, ?, ?, ?)",
  ).run(
    credential.id,
    session.user.email.toLowerCase().trim(),
    b64urlKey,
    credential.counter,
    transportsJson,
  );

  try {
    db.prepare(`
      INSERT OR REPLACE INTO webauthn_credentials (user_id, credential_id, public_key, counter, transports)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      String(session.user.id),
      credential.id,
      b64Key,
      credential.counter,
      transportsJson,
    );
  } catch {}

  return { ok: true as const };
}

export async function beginPasskeyLoginHandler(data: { email: string }) {
  const email = data.email.toLowerCase().trim();
  const db = await getDatabase();
  let credentials = db
    .prepare("SELECT credential_id, transports FROM passkeys WHERE email = ?")
    .all(email) as { credential_id: string; transports: string }[];
  if (!credentials.length) {
    try {
      credentials = db
        .prepare(`
          SELECT c.credential_id, c.transports
          FROM webauthn_credentials c
          JOIN users u ON u.id = c.user_id
          WHERE lower(trim(u.email)) = ?
        `)
        .all(email) as { credential_id: string; transports: string }[];
    } catch {}
  }
  if (!credentials.length)
    return {
      ok: false as const,
      error: "No biometric sign-in is set up for this email. Sign in with your password to set up fingerprint sign-in on this device.",
    };
  const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
  const rp = webAuthnRp();
  const options = await generateAuthenticationOptions({
    rpID: rp.rpID,
    timeout: 120_000,
    userVerification: "preferred",
    allowCredentials: credentials.map((item) => ({
      id: item.credential_id,
      transports: item.transports ? JSON.parse(item.transports) : undefined,
    })),
  });
  await saveWebAuthnChallenge(email, "authentication", options.challenge);
  return { ok: true as const, options };
}

export async function finishPasskeyLoginHandler(data: {
  email: string;
  role: AccountRole;
  response: unknown;
}) {
  const email = data.email.toLowerCase().trim();
  const challenge = await consumeWebAuthnChallenge(email, "authentication");
  if (!challenge) return { ok: false as const, error: "Biometric sign-in expired. Try again." };
  const credentialId = String((data.response as { id?: string }).id || "");
  const db = await getDatabase();
  let stored = db
    .prepare(
      "SELECT credential_id, public_key, counter, transports FROM passkeys WHERE email = ? AND credential_id = ?",
    )
    .get(email, credentialId) as
    { credential_id: string; public_key: string; counter: number; transports: string } | undefined;
  if (!stored) {
    try {
      stored = db
        .prepare(`
          SELECT c.credential_id, c.public_key, c.counter, c.transports
          FROM webauthn_credentials c
          JOIN users u ON u.id = c.user_id
          WHERE lower(trim(u.email)) = ? AND c.credential_id = ?
        `)
        .get(email, credentialId) as
        { credential_id: string; public_key: string; counter: number; transports: string } | undefined;
    } catch {}
  }
  if (!stored) return { ok: false as const, error: "Biometric credential not found." };

  let clientOrigin: string | undefined;
  try {
    const respObj = data.response as { response?: { clientDataJSON?: string } };
    if (respObj?.response?.clientDataJSON) {
      const clientDataBuffer = Buffer.from(respObj.response.clientDataJSON, "base64url");
      const clientData = JSON.parse(clientDataBuffer.toString("utf-8"));
      if (typeof clientData.origin === "string") clientOrigin = clientData.origin;
    }
  } catch {}

  const isBase64Url = stored.public_key.includes("-") || stored.public_key.includes("_");
  const pubKeyBytes = new Uint8Array(
    Buffer.from(stored.public_key, isBase64Url ? "base64url" : "base64"),
  );

  const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
  const rp = webAuthnRp();
  const verification = await verifyAuthenticationResponse({
    response: data.response as never,
    expectedChallenge: challenge,
    expectedOrigin: webAuthnOrigins(clientOrigin),
    expectedRPID: rp.rpID,
    credential: {
      id: stored.credential_id,
      publicKey: pubKeyBytes,
      counter: stored.counter,
      transports: stored.transports ? JSON.parse(stored.transports) : undefined,
    },
    requireUserVerification: false,
  });
  if (!verification.verified)
    return { ok: false as const, error: "Biometric sign-in could not be verified." };

  try {
    db.prepare("UPDATE passkeys SET counter = ? WHERE credential_id = ?").run(
      verification.authenticationInfo.newCounter,
      stored.credential_id,
    );
  } catch {}
  try {
    db.prepare("UPDATE webauthn_credentials SET counter = ? WHERE credential_id = ?").run(
      verification.authenticationInfo.newCounter,
      stored.credential_id,
    );
  } catch {}
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
  if (!user && isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const mongoUser = await mongo.collection("users").findOne({ email });
      if (!mongoUser || (!isUserAdmin(mongoUser) && mongoUser["role"] !== data.role)) {
        return { ok: false as const, error: "Incorrect email or portal." };
      }
      if (
        isEmailVerificationRequired() &&
        !Boolean(mongoUser["emailVerified"] ?? mongoUser["email_verified"]) &&
        !isUserAdmin(mongoUser)
      ) {
        return { ok: false as const, error: "Verify your email before using biometric sign-in." };
      }
      const role: AccountRole = isUserAdmin(mongoUser)
        ? data.role
        : (mongoUser["role"] as AccountRole);
      const token = await createSession("mongo", mongoUser["_id"].toString(), role);
      setSessionCookie(token);
      return {
        ok: true as const,
        user: {
          id: mongoUser["_id"].toString(),
          fullName: String(mongoUser["fullName"] || mongoUser["full_name"]),
          email,
          role,
          emailVerified: Boolean(mongoUser["emailVerified"] ?? mongoUser["email_verified"]),
          isAdmin: isUserAdmin(mongoUser),
        },
        token,
      };
    } catch {
      // SQLite fallback below returns the neutral authentication failure.
    }
  }
  if (!user || (user.role !== data.role && !isUserAdmin(user)))
    return { ok: false as const, error: "Incorrect email or portal." };
  if (isEmailVerificationRequired() && !Boolean(user.email_verified) && !isUserAdmin(user))
    return { ok: false as const, error: "Verify your email before using biometric sign-in." };
  const effectiveRole: AccountRole = isUserAdmin(user) ? data.role : user.role;
  const token = await createSession(db, user.id, effectiveRole);
  setSessionCookie(token);
  return {
    ok: true as const,
    user: { ...publicUser(user), role: effectiveRole, isAdmin: isUserAdmin(user) },
    token,
  };
}


export function getClientIp(): string {
  try {
    const ip =
      getRequestIP({ xForwardedFor: true }) ||
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
      getRequestHeader("x-real-ip") ||
      "127.0.0.1";
    return ip;
  } catch {
    return "127.0.0.1";
  }
}

async function recordFailedLoginAttempt(
  dbOrMongo: SqliteDatabase | "mongo",
  key: string,
): Promise<number> {
  const lockDurationMs = 15 * 60 * 1000;
  const now = new Date();

  if (dbOrMongo === "mongo") {
    const mongo = await getMongoDb();
    const existing = await mongo.collection("login_attempts").findOne({ key });
    const newAttempts = ((existing?.["attempts"] as number) ?? 0) + 1;
    let lockUntil: Date | null = null;
    if (newAttempts >= 5) {
      lockUntil = new Date(Date.now() + lockDurationMs);
    }
    await mongo.collection("login_attempts").updateOne(
      { key },
      {
        $set: {
          attempts: newAttempts,
          lockUntil,
          lastAttempt: now,
        },
      },
      { upsert: true },
    );
    return newAttempts;
  }

  const row = dbOrMongo.prepare("SELECT attempts FROM login_attempts WHERE key = ?").get(key) as
    { attempts: number } | undefined;
  const newAttempts = (row?.attempts ?? 0) + 1;
  let lockUntil: string | null = null;
  if (newAttempts >= 5) {
    lockUntil = new Date(Date.now() + lockDurationMs).toISOString();
  }
  dbOrMongo
    .prepare(
      `
    INSERT INTO login_attempts (key, attempts, lock_until, last_attempt)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      attempts = excluded.attempts,
      lock_until = excluded.lock_until,
      last_attempt = excluded.last_attempt
  `,
    )
    .run(key, newAttempts, lockUntil, now.toISOString());
  return newAttempts;
}

export async function registerAccountHandler(data: {
  fullName: string;
  email: string;
  role: AccountRole;
  password: string;
}) {
  const safeRole: AccountRole = data.role === "employer" ? "employer" : "candidate";
  const normalizedEmail = data.email.toLowerCase().trim();
  const cleanName = data.fullName.trim();
  const salt = (await crypto()).randomBytes(16).toString("hex");
  const hashed = await passwordHash(data.password, salt);

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const existing = await mongo.collection("users").findOne({
        email: normalizedEmail,
      });
      if (existing) {
        return { ok: false as const, error: "An account already exists for this email address." };
      }
      const insertResult = await mongo.collection("users").insertOne({
        fullName: cleanName,
        full_name: cleanName,
        email: normalizedEmail,
        role: safeRole,
        isAdmin: false,
        is_admin: 0,
        passwordHash: hashed,
        password_hash: hashed,
        passwordSalt: salt,
        password_salt: salt,
        emailVerified: false,
        email_verified: 0,
        createdAt: new Date(),
      });
      const userId = insertResult.insertedId.toString();

      if (isEmailVerificationRequired()) {
        void requestEmailVerificationHandler({ email: normalizedEmail });
        return {
          ok: true as const,
          requiresVerification: true as const,
          message:
            "Account registered! A 6-digit verification code has been sent to your email. Please verify your email to activate your account.",
          user: {
            id: userId,
            fullName: cleanName,
            email: normalizedEmail,
            role: safeRole,
            emailVerified: false,
            isAdmin: false,
          },
        };
      }

      const token = await createSession("mongo", userId, safeRole);
      setSessionCookie(token);
      return {
        ok: true as const,
        user: {
          id: userId,
          fullName: cleanName,
          email: normalizedEmail,
          role: safeRole,
          emailVerified: false,
          isAdmin: false,
        },
        token,
      };
    } catch (err: unknown) {
      console.warn("MongoDB Atlas registration note (falling back to SQLite if needed):", err);
    }
  }

  // SQLite implementation (active if MongoDB is unconfigured or unavailable)
  const db = await getDatabase();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail) as
    { id: number } | undefined;
  if (existing) {
    return { ok: false as const, error: "An account already exists for this email address." };
  }
  const result = db
    .prepare(
      "INSERT INTO users (full_name, email, role, password_hash, password_salt, email_verified) VALUES (?, ?, ?, ?, ?, 0)",
    )
    .run(cleanName, normalizedEmail, safeRole, hashed, salt);
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as UserRow;

  if (isEmailVerificationRequired()) {
    void requestEmailVerificationHandler({ email: normalizedEmail });
    return {
      ok: true as const,
      requiresVerification: true as const,
      message:
        "Account registered! A 6-digit verification code has been sent to your email. Please verify your email to activate your account.",
      user: { ...publicUser(row), isAdmin: false },
    };
  }

  const token = await createSession(db, row.id, safeRole);
  setSessionCookie(token);
  return { ok: true as const, user: { ...publicUser(row), isAdmin: false }, token };
}

export async function loginAccountHandler(data: {
  email: string;
  password: string;
  role: AccountRole;
  rememberMe?: boolean | undefined;
}) {
  const ip = getClientIp();
  const ipKey = `ip:${ip}`;
  const emailKey = `email:${data.email.toLowerCase()}`;

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const now = new Date();

      // Check brute-force lockouts in MongoDB
      const ipLock = await mongo.collection("login_attempts").findOne({
        key: ipKey,
        lockUntil: { $gt: now },
      });
      const emailLock = await mongo.collection("login_attempts").findOne({
        key: emailKey,
        lockUntil: { $gt: now },
      });

      if (ipLock || emailLock) {
        const lockUntilDate = (ipLock?.["lockUntil"] || emailLock?.["lockUntil"]) as Date;
        const remainingMinutes = Math.max(
          1,
          Math.ceil((lockUntilDate.getTime() - Date.now()) / (60 * 1000)),
        );
        return {
          ok: false as const,
          error: `Too many failed login attempts. Temporarily locked for security. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} or reset your password.`,
        };
      }

      const userDoc = await mongo.collection("users").findOne({
        email: data.email.toLowerCase(),
      });

      const isAdmin = isUserAdmin(userDoc);

      let authFailed = false;
      if (!userDoc || (!isAdmin && userDoc["role"] !== data.role)) {
        authFailed = true;
      } else {
        const pHash = String(userDoc["passwordHash"] || userDoc["password_hash"] || "");
        const pSalt = String(userDoc["passwordSalt"] || userDoc["password_salt"] || "");
        const expected = Buffer.from(pHash, "hex");
        const supplied = Buffer.from(await passwordHash(data.password, pSalt), "hex");
        if (
          expected.length !== supplied.length ||
          !(await crypto()).timingSafeEqual(expected, supplied)
        ) {
          authFailed = true;
        }
      }

      if (authFailed) {
        const ipAttempts = await recordFailedLoginAttempt("mongo", ipKey);
        const emailAttempts = await recordFailedLoginAttempt("mongo", emailKey);
        const maxAttempts = Math.max(ipAttempts, emailAttempts);
        if (maxAttempts >= 5) {
          return {
            ok: false as const,
            error:
              "Too many failed login attempts. Your account has been temporarily locked for 15 minutes. You can reset your password to unlock immediately.",
          };
        }
        const remaining = Math.max(1, 5 - maxAttempts);
        return {
          ok: false as const,
          error: `Incorrect email, password, or portal. (${remaining} attempt${remaining === 1 ? "" : "s"} remaining before lock)`,
        };
      }

      // Check email verification enforcement
      const isVerified = Boolean(userDoc!["emailVerified"] ?? userDoc!["email_verified"]);
      if (isEmailVerificationRequired() && !isVerified && !isAdmin) {
        void requestEmailVerificationHandler({ email: String(userDoc!["email"]) });
        return {
          ok: false as const,
          error:
            "Email verification is required before signing in. A 6-digit verification code has been sent to your email.",
          requiresVerification: true as const,
          email: String(userDoc!["email"]),
        };
      }

      // Success: clear lockout counters
      await mongo.collection("login_attempts").deleteMany({ key: { $in: [ipKey, emailKey] } });
      const userId = userDoc!["_id"].toString();
      const effectiveRole: AccountRole = isAdmin ? data.role : (userDoc!["role"] as AccountRole);
      const remember = data.rememberMe ?? true;
      const token = await createSession("mongo", userId, effectiveRole, remember);
      setSessionCookie(token, remember);

      return {
        ok: true as const,
        user: {
          id: userId,
          fullName: String(userDoc!["fullName"] || userDoc!["full_name"]),
          email: String(userDoc!["email"]),
          role: effectiveRole,
          emailVerified: Boolean(userDoc!["emailVerified"] ?? userDoc!["email_verified"]),
          isAdmin,
        },
        token,
      };
    } catch (err: unknown) {
      console.warn("MongoDB Atlas login note (falling back to SQLite):", err);
    }
  }

  // SQLite fallback
  const db = await getDatabase();
  const nowIso = new Date().toISOString();

  const ipLock = db
    .prepare("SELECT attempts, lock_until FROM login_attempts WHERE key = ? AND lock_until > ?")
    .get(ipKey, nowIso) as { attempts: number; lock_until: string } | undefined;
  const emailLock = db
    .prepare("SELECT attempts, lock_until FROM login_attempts WHERE key = ? AND lock_until > ?")
    .get(emailKey, nowIso) as { attempts: number; lock_until: string } | undefined;

  if (ipLock || emailLock) {
    const lockUntil = ipLock ? new Date(ipLock.lock_until) : new Date(emailLock!.lock_until);
    const remainingMinutes = Math.max(
      1,
      Math.ceil((lockUntil.getTime() - Date.now()) / (60 * 1000)),
    );
    return {
      ok: false as const,
      error: `Too many failed login attempts. Temporarily locked for security. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} or reset your password.`,
    };
  }

  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(data.email) as
    UserRow | undefined;
  const isRowAdmin = isUserAdmin(row);
  let authFailed = false;

  if (!row || (!isRowAdmin && row.role !== data.role)) {
    authFailed = true;
  } else {
    const expected = Buffer.from(row.password_hash, "hex");
    const supplied = Buffer.from(await passwordHash(data.password, row.password_salt), "hex");
    if (
      expected.length !== supplied.length ||
      !(await crypto()).timingSafeEqual(expected, supplied)
    ) {
      authFailed = true;
    }
  }

  if (authFailed) {
    const ipAttempts = await recordFailedLoginAttempt(db, ipKey);
    const emailAttempts = await recordFailedLoginAttempt(db, emailKey);
    const maxAttempts = Math.max(ipAttempts, emailAttempts);

    if (maxAttempts >= 5) {
      return {
        ok: false as const,
        error:
          "Too many failed login attempts. Your account has been temporarily locked for 15 minutes. You can reset your password to unlock immediately.",
      };
    }

    const remaining = Math.max(1, 5 - maxAttempts);
    return {
      ok: false as const,
      error: `Incorrect email, password, or portal. (${remaining} attempt${remaining === 1 ? "" : "s"} remaining before lock)`,
    };
  }

  // Check email verification enforcement
  const isRowVerified = Boolean(row!.email_verified);
  if (isEmailVerificationRequired() && !isRowVerified && !isRowAdmin) {
    void requestEmailVerificationHandler({ email: row!.email });
    return {
      ok: false as const,
      error:
        "Email verification is required before signing in. A 6-digit verification code has been sent to your email.",
      requiresVerification: true as const,
      email: row!.email,
    };
  }

  db.prepare("DELETE FROM login_attempts WHERE key IN (?, ?)").run(ipKey, emailKey);
  const effectiveRole: AccountRole = isRowAdmin ? data.role : row!.role;
  const remember = data.rememberMe ?? true;
  const token = await createSession(db, row!.id, effectiveRole, remember);
  setSessionCookie(token, remember);
  return {
    ok: true as const,
    user: {
      ...publicUser(row!),
      role: effectiveRole,
      isAdmin: isRowAdmin,
    },
    token,
  };
}

export async function readSessionHandler(data: { token?: string | undefined }) {
  const cookieToken = getSessionCookieToken();
  const token = cookieToken || data.token;
  if (!token) return { user: null };

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const sessionDoc = await mongo.collection("sessions").findOne({
        token,
        expiresAt: { $gt: new Date() },
      });
      if (sessionDoc) {
        let userDoc = null;
        try {
          userDoc = await mongo.collection("users").findOne({
            _id: new ObjectId(sessionDoc["userId"] as string),
          });
        } catch {
          userDoc = await mongo.collection("users").findOne({
            id: sessionDoc["userId"],
          });
        }
        if (userDoc) {
          const isAdmin = isUserAdmin(userDoc);
          const activeRole = (sessionDoc["role"] || userDoc["role"]) as AccountRole;
          return {
            user: {
              id: userDoc["_id"].toString(),
              fullName: String(userDoc["fullName"] || userDoc["full_name"]),
              email: String(userDoc["email"]),
              role: activeRole,
              emailVerified: Boolean(userDoc["emailVerified"] ?? userDoc["email_verified"]),
              isAdmin,
            },
          };
        }
      }
    } catch (err) {
      console.warn("MongoDB Atlas readSession note:", err);
    }
  }

  // SQLite fallback
  const db = await getDatabase();
  const row = db
    .prepare(
      "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > ?",
    )
    .get(token, new Date().toISOString()) as UserRow | undefined;

  if (!row) {
    if (cookieToken) clearSessionCookie();
    return { user: null };
  }

  return { user: { ...publicUser(row), isAdmin: isUserAdmin(row) } };
}

export async function logoutAccountHandler(data: { token?: string | undefined }) {
  const cookieToken = getSessionCookieToken();
  const token = cookieToken || data.token;

  if (isMongoConfigured() && token) {
    try {
      const mongo = await getMongoDb();
      await mongo.collection("sessions").deleteMany({ token });
    } catch (err) {
      void err;
    }
  }

  const db = await getDatabase();
  if (token) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }
  clearSessionCookie();
  return { ok: true as const };
}

export async function requestPasswordResetHandler(data: { email: string }) {
  const normalizedEmail = data.email.toLowerCase().trim();
  const rawResetToken = (await crypto()).randomBytes(32).toString("hex");
  const hashedToken = await hashResetToken(rawResetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const user = await mongo.collection("users").findOne({ email: normalizedEmail });
      if (user) {
        await mongo.collection("password_resets").insertOne({
          email: normalizedEmail,
          token: hashedToken,
          expiresAt,
          usedAt: null,
          createdAt: new Date(),
        });
        void sendPasswordResetEmail({ to: normalizedEmail, token: rawResetToken });
      }
      return {
        ok: true as const,
        message:
          "If an account exists with this email address, password reset instructions have been sent to your inbox.",
      };
    } catch (err) {
      console.warn("MongoDB Atlas requestPasswordReset note:", err);
    }
  }

  const db = await getDatabase();
  const user = db.prepare("SELECT id, email FROM users WHERE email = ?").get(normalizedEmail) as
    { id: number; email: string } | undefined;

  if (user) {
    db.prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)").run(
      normalizedEmail,
      hashedToken,
      expiresAt.toISOString(),
    );
    void sendPasswordResetEmail({ to: normalizedEmail, token: rawResetToken });
  }

  return {
    ok: true as const,
    message:
      "If an account exists with this email address, password reset instructions have been sent to your inbox.",
  };
}

export async function confirmPasswordResetHandler(data: { token: string; newPassword: string }) {
  const token = data.token.trim();
  if (!token || token.length < 16) {
    return { ok: false as const, error: "Invalid password reset token format." };
  }
  const hashedToken = await hashResetToken(token);
  const newSalt = (await crypto()).randomBytes(16).toString("hex");
  const newHash = await passwordHash(data.newPassword, newSalt);

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const resetDoc = await mongo.collection("password_resets").findOne({
        token: { $in: [hashedToken, token] },
        expiresAt: { $gt: new Date() },
        usedAt: null,
      });

      if (!resetDoc) {
        return {
          ok: false as const,
          error: "Invalid or expired password reset link. Please request a new reset code.",
        };
      }

      const email = String(resetDoc["email"]);
      const userDoc = await mongo.collection("users").findOne({ email });
      if (!userDoc) {
        return { ok: false as const, error: "User account not found." };
      }

      await mongo.collection("users").updateOne(
        { email },
        {
          $set: {
            passwordHash: newHash,
            password_hash: newHash,
            passwordSalt: newSalt,
            password_salt: newSalt,
            updatedAt: new Date(),
          },
        },
      );
      await mongo
        .collection("password_resets")
        .updateOne({ _id: resetDoc["_id"] }, { $set: { usedAt: new Date() } });
      await mongo.collection("sessions").deleteMany({ userId: userDoc["_id"].toString() });
      await mongo.collection("login_attempts").deleteMany({ key: `email:${email}` });

      const isAdmin = isUserAdmin(userDoc);
      const role = userDoc["role"] as AccountRole;
      const sessionToken = await createSession("mongo", userDoc["_id"].toString(), role);
      setSessionCookie(sessionToken);
      return {
        ok: true as const,
        user: {
          id: userDoc["_id"].toString(),
          fullName: String(userDoc["fullName"] || userDoc["full_name"]),
          email: String(userDoc["email"]),
          role,
          emailVerified: Boolean(userDoc["emailVerified"] ?? userDoc["email_verified"]),
          isAdmin,
        },
        token: sessionToken,
      };
    } catch (err) {
      console.warn("MongoDB Atlas confirmPasswordReset note:", err);
    }
  }

  const db = await getDatabase();
  const resetRow = db
    .prepare(
      "SELECT * FROM password_resets WHERE (token = ? OR token = ?) AND expires_at > ? AND used_at IS NULL",
    )
    .get(hashedToken, token, new Date().toISOString()) as { id: number; email: string } | undefined;

  if (!resetRow) {
    return {
      ok: false as const,
      error: "Invalid or expired password reset link. Please request a new reset code.",
    };
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(resetRow.email) as
    UserRow | undefined;
  if (!user) {
    return { ok: false as const, error: "User account not found." };
  }

  db.prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?").run(
    newHash,
    newSalt,
    user.id,
  );
  db.prepare("UPDATE password_resets SET used_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    resetRow.id,
  );

  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
  db.prepare("DELETE FROM login_attempts WHERE key LIKE ?").run(
    `email:${user.email.toLowerCase()}`,
  );

  const isAdmin = isUserAdmin(user);
  const sessionToken = await createSession(db, user.id, user.role);
  setSessionCookie(sessionToken);
  return { ok: true as const, user: { ...publicUser(user), isAdmin }, token: sessionToken };
}

export async function requestEmailVerificationHandler(data: { email: string }) {
  const normalizedEmail = data.email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      await mongo.collection("email_verifications").deleteMany({ email: normalizedEmail });
      await mongo.collection("email_verifications").insertOne({
        email: normalizedEmail,
        code,
        expiresAt,
        createdAt: new Date(),
      });
      void sendEmailVerificationCode({ to: normalizedEmail, code });
      return {
        ok: true as const,
        message: "A 6-digit verification code has been sent to your email.",
      };
    } catch (err) {
      void err;
    }
  }

  const db = await getDatabase();
  db.prepare("DELETE FROM email_verifications WHERE email = ?").run(normalizedEmail);
  db.prepare("INSERT INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?)").run(
    normalizedEmail,
    code,
    expiresAt.toISOString(),
  );
  void sendEmailVerificationCode({ to: normalizedEmail, code });
  return { ok: true as const, message: "A 6-digit verification code has been sent to your email." };
}

export async function verifyEmailHandler(data: { email: string; code: string }) {
  const normalizedEmail = data.email.toLowerCase().trim();
  const code = data.code.trim();

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const row = await mongo.collection("email_verifications").findOne({
        email: normalizedEmail,
        code,
        expiresAt: { $gt: new Date() },
      });
      if (row) {
        await mongo
          .collection("users")
          .updateOne(
            { email: normalizedEmail },
            { $set: { emailVerified: true, email_verified: 1 } },
          );
        await mongo.collection("email_verifications").deleteOne({ _id: row["_id"] });

        const userDoc = await mongo.collection("users").findOne({ email: normalizedEmail });
        let token: string | undefined;
        let userPayload: AuthUser | undefined;
        if (userDoc) {
          const userId = userDoc["_id"].toString();
          const userRole = (userDoc["role"] as AccountRole) || "candidate";
          token = await createSession("mongo", userId, userRole);
          setSessionCookie(token);
          userPayload = {
            id: userId,
            fullName: String(userDoc["fullName"] || userDoc["full_name"]),
            email: normalizedEmail,
            role: userRole,
            emailVerified: true,
            isAdmin: isUserAdmin(userDoc),
          };
        }

        return {
          ok: true as const,
          message: "Email successfully verified! Welcome to Ableo.",
          user: userPayload,
          token,
        };
      }
      return { ok: false as const, error: "Invalid or expired verification code." };
    } catch (err) {
      void err;
    }
  }

  const db = await getDatabase();
  const row = db
    .prepare("SELECT * FROM email_verifications WHERE email = ? AND code = ? AND expires_at > ?")
    .get(normalizedEmail, code, new Date().toISOString()) as { id: number } | undefined;

  if (!row) {
    return { ok: false as const, error: "Invalid or expired verification code." };
  }

  db.prepare("UPDATE users SET email_verified = 1 WHERE email = ?").run(normalizedEmail);
  db.prepare("DELETE FROM email_verifications WHERE id = ?").run(row.id);

  const userRow = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail) as
    UserRow | undefined;
  let token: string | undefined;
  let userPayload: AuthUser | undefined;
  if (userRow) {
    token = await createSession(db, userRow.id, userRow.role);
    setSessionCookie(token);
    userPayload = { ...publicUser(userRow), isAdmin: isUserAdmin(userRow), emailVerified: true };
  }

  return {
    ok: true as const,
    message: "Email successfully verified! Welcome to Ableo.",
    user: userPayload,
    token,
  };
}

export async function verifyAiAuthAndRateLimit(): Promise<
  { ok: true; user: AuthUser; ip: string } | { ok: false; error: string }
> {
  const token = getSessionCookieToken();
  if (!token) {
    return {
      ok: false,
      error: "Authentication required: Please sign in to your Ableo account to access AI features.",
    };
  }

  const ip = getClientIp();
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const USER_LIMIT = 20;
  const IP_LIMIT = 30;

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const sessionDoc = await mongo.collection("sessions").findOne({
        token,
        expiresAt: { $gt: new Date() },
      });
      if (!sessionDoc) {
        clearSessionCookie();
        return {
          ok: false,
          error: "Your session has expired or is invalid. Please sign in again.",
        };
      }

      let userDoc = null;
      try {
        userDoc = await mongo.collection("users").findOne({
          _id: new ObjectId(sessionDoc["userId"] as string),
        });
      } catch {
        userDoc = await mongo.collection("users").findOne({
          id: sessionDoc["userId"],
        });
      }

      if (!userDoc) {
        clearSessionCookie();
        return {
          ok: false,
          error: "Your session has expired or is invalid. Please sign in again.",
        };
      }

      const isUserVerified = Boolean(userDoc["emailVerified"] ?? userDoc["email_verified"]);
      if (isEmailVerificationRequired() && !isUserVerified && !isUserAdmin(userDoc)) {
        return {
          ok: false,
          error:
            "Email verification required: Please verify your email before accessing AI features.",
        };
      }

      const cutoffDate = new Date(now - windowMs);
      await mongo.collection("ai_rate_limits").deleteMany({ windowStart: { $lt: cutoffDate } });

      const userKey = `user:${userDoc["_id"]}`;
      const ipKey = `ip:${ip}`;

      const userRec = await mongo.collection("ai_rate_limits").findOne({ key: userKey });
      const ipRec = await mongo.collection("ai_rate_limits").findOne({ key: ipKey });

      if (userRec && (userRec["count"] as number) >= USER_LIMIT) {
        return {
          ok: false,
          error:
            "Rate limit reached: You have made too many AI requests recently (20 requests per 5 minutes). Please wait a few moments before continuing.",
        };
      }

      if (ipRec && (ipRec["count"] as number) >= IP_LIMIT) {
        return {
          ok: false,
          error:
            "Rate limit reached: Too many AI requests originating from this network. Please wait a few moments before continuing.",
        };
      }

      await mongo.collection("ai_rate_limits").updateOne(
        { key: userKey },
        {
          $inc: { count: 1 },
          $setOnInsert: { windowStart: new Date() },
        },
        { upsert: true },
      );

      await mongo.collection("ai_rate_limits").updateOne(
        { key: ipKey },
        {
          $inc: { count: 1 },
          $setOnInsert: { windowStart: new Date() },
        },
        { upsert: true },
      );

      return {
        ok: true,
        user: {
          id: userDoc["_id"].toString(),
          fullName: String(userDoc["fullName"] || userDoc["full_name"]),
          email: String(userDoc["email"]),
          role: userDoc["role"] as AccountRole,
          emailVerified: Boolean(userDoc["emailVerified"] ?? userDoc["email_verified"]),
        },
        ip,
      };
    } catch (err) {
      console.warn("MongoDB Atlas AI rate limit note (falling back to SQLite):", err);
    }
  }

  // SQLite implementation
  const db = await getDatabase();
  const row = db
    .prepare(
      "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > ?",
    )
    .get(token, new Date().toISOString()) as UserRow | undefined;

  if (!row) {
    clearSessionCookie();
    return {
      ok: false,
      error: "Your session has expired or is invalid. Please sign in again to access AI features.",
    };
  }

  const isRowVerified = Boolean(row.email_verified);
  if (isEmailVerificationRequired() && !isRowVerified && !isUserAdmin(row)) {
    return {
      ok: false,
      error: "Email verification required: Please verify your email before accessing AI features.",
    };
  }

  const cutoffIso = new Date(now - windowMs).toISOString();
  db.prepare("DELETE FROM ai_rate_limits WHERE window_start < ?").run(cutoffIso);

  const userKey = `user:${row.id}`;
  const ipKey = `ip:${ip}`;

  const userRec = db
    .prepare("SELECT count, window_start FROM ai_rate_limits WHERE key = ?")
    .get(userKey) as { count: number; window_start: string } | undefined;
  const ipRec = db
    .prepare("SELECT count, window_start FROM ai_rate_limits WHERE key = ?")
    .get(ipKey) as { count: number; window_start: string } | undefined;

  if (userRec && userRec.count >= USER_LIMIT) {
    return {
      ok: false,
      error:
        "Rate limit reached: You have made too many AI requests recently (20 requests per 5 minutes). Please wait a few moments before continuing.",
    };
  }

  if (ipRec && ipRec.count >= IP_LIMIT) {
    return {
      ok: false,
      error:
        "Rate limit reached: Too many AI requests originating from this network. Please wait a few moments before continuing.",
    };
  }

  db.prepare(
    `
    INSERT INTO ai_rate_limits (key, count, window_start)
    VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = count + 1
  `,
  ).run(userKey, userRec ? userRec.window_start : new Date().toISOString());

  db.prepare(
    `
    INSERT INTO ai_rate_limits (key, count, window_start)
    VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = count + 1
  `,
  ).run(ipKey, ipRec ? ipRec.window_start : new Date().toISOString());

  return { ok: true, user: publicUser(row), ip };
}

export async function getDatabaseStatusHandler() {
  const isAtlas = isMongoConfigured();
  if (!isAtlas) {
    return {
      type: "sqlite" as const,
      connected: true,
      message:
        "Running on SQLite storage (local). To connect MongoDB Atlas, set MONGODB_URI in .env.",
    };
  }
  const check = await checkMongoConnection();
  return {
    type: "mongodb" as const,
    connected: check.connected,
    dbName: check.dbName,
    message: check.connected
      ? `Connected to MongoDB Atlas database "${check.dbName}".`
      : `MongoDB Atlas connection error: ${check.error}`,
  };
}

export async function getUserProfileHandler(data: {
  token?: string | undefined;
  email?: string | undefined;
}) {
  const sessionResult = await readSessionHandler(data);
  const user = sessionResult.user;

  // SECURITY: Only use the authenticated session's email.
  // Never fall back to a client-supplied email — that would let
  // any unauthenticated caller read arbitrary profiles.
  const targetEmail = user?.email;

  if (!targetEmail) {
    return { ok: false, error: "Authentication required to read profile" };
  }

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const doc = await mongo.collection("profiles").findOne({ email: targetEmail });
      if (doc) {
        // Strip _id before returning
        const { _id, ...profileData } = doc;
        return { ok: true, profile: profileData, source: "mongodb" as const };
      }
    } catch (err) {
      console.warn("MongoDB Atlas getUserProfile note:", err);
    }
  }

  // SQLite fallback
  const db = await getDatabase();
  const row = db.prepare("SELECT profile_data FROM profiles WHERE email = ?").get(targetEmail) as
    { profile_data: string } | undefined;

  if (row) {
    try {
      return { ok: true, profile: JSON.parse(row.profile_data), source: "sqlite" as const };
    } catch {
      // parse failure
    }
  }

  return {
    ok: true,
    profile: null,
    source: isMongoConfigured() ? ("mongodb" as const) : ("sqlite" as const),
  };
}

export async function saveUserProfileHandler(data: {
  profile: Record<string, unknown>;
  token?: string | undefined;
  email?: string | undefined;
}) {
  const sessionResult = await readSessionHandler(data);
  const user = sessionResult.user;

  // SECURITY: Only use the authenticated session's email.
  // Never fall back to client-supplied email or profile.email — that would let
  // any unauthenticated caller overwrite arbitrary profiles.
  const targetEmail = user?.email;

  if (!targetEmail) {
    return {
      ok: false,
      error: "Please sign in to save your profile to the cloud database.",
    };
  }

  const profilePayload = {
    ...data.profile,
    email: targetEmail,
    updatedAt: new Date().toISOString(),
  };

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      await mongo
        .collection("profiles")
        .updateOne({ email: targetEmail }, { $set: profilePayload }, { upsert: true });

      // If full name is changed, update user account as well
      if (typeof data.profile["name"] === "string" && data.profile["name"].trim()) {
        const trimmedName = data.profile["name"].trim();
        await mongo
          .collection("users")
          .updateOne(
            { email: targetEmail },
            { $set: { fullName: trimmedName, full_name: trimmedName } },
          );
      }

      return { ok: true, profile: profilePayload, storage: "mongodb" as const };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Atlas is optional in Ableo. Keep a profile save usable when an Atlas
      // TLS handshake or network outage occurs, just as the other auth paths
      // already do. The SQLite copy also makes the profile available to this
      // deployment until Atlas recovers.
      console.warn("MongoDB Atlas profile write note (falling back to SQLite):", err);
      console.warn(`MongoDB Atlas profile write error: ${msg}`);
    }
  }

  // SQLite fallback
  try {
    const db = await getDatabase();
    db.prepare(
      `
      INSERT INTO profiles (email, profile_data, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(email) DO UPDATE SET
        profile_data = excluded.profile_data,
        updated_at = CURRENT_TIMESTAMP
    `,
    ).run(targetEmail, JSON.stringify(profilePayload));

    if (typeof data.profile["name"] === "string" && data.profile["name"].trim()) {
      db.prepare("UPDATE users SET full_name = ? WHERE email = ?").run(
        data.profile["name"].trim(),
        targetEmail,
      );
    }

    return { ok: true, profile: profilePayload, storage: "sqlite" as const };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `SQLite storage error: ${msg}` };
  }
}
