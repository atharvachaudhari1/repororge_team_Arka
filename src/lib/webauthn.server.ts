/**
 * WebAuthn (biometric) server-side handlers.
 *
 * Supports platform authenticators (Touch ID, Face ID, Windows Hello,
 * Android biometrics) for passwordless sign-in.
 *
 * Credential storage mirrors the dual MongoDB / SQLite pattern used by
 * the rest of the auth system.
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { getRequestHeader } from "@tanstack/react-start/server";
import {
  getDatabase,
  setSessionCookie,
  isUserAdmin,
} from "./auth.server";
import { isMongoConfigured, getMongoDb } from "./mongodb.server";
import type { AccountRole, AuthUser } from "./auth.functions";

// ─── RP (Relying Party) Configuration ────────────────────────────────
const RP_NAME = "Ableo";

export function getRpId(customHost?: string): string {
  if (process.env["WEBAUTHN_RP_ID"]) {
    return process.env["WEBAUTHN_RP_ID"];
  }
  if (customHost) {
    try {
      const hostname = customHost.includes("://") ? new URL(customHost).hostname : customHost.split(":")[0];
      if (hostname) return hostname;
    } catch {
      // ignore
    }
  }
  try {
    const host = getRequestHeader("host");
    if (host) {
      const hostname = host.split(":")[0];
      if (hostname) return hostname;
    }
  } catch {
    // not in request context
  }
  return "localhost";
}

export function getExpectedOrigins(extraOrigin?: string): string[] {
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

  if (extraOrigin) {
    try {
      const parsed = new URL(extraOrigin);
      if (
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === getRpId()
      ) {
        defaults.push(extraOrigin);
      }
    } catch {
      // not a valid URL
    }
  }

  return Array.from(new Set([...customOrigins, ...defaults]));
}

// ─── Types ───────────────────────────────────────────────────────────

type StoredCredential = {
  credentialId: string; // base64url
  publicKey: string; // base64
  counter: number;
  transports: string[];
  createdAt: string;
};

type ChallengeRecord = {
  challenge: string;
  userId?: string | undefined;
  email?: string | undefined;
  type: "registration" | "authentication";
  expiresAt: Date;
};

// ─── SQLite Schema ───────────────────────────────────────────────────

async function ensureWebAuthnTables() {
  const db = await getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS webauthn_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      credential_id TEXT NOT NULL UNIQUE,
      public_key TEXT NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      transports TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS webauthn_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge TEXT NOT NULL UNIQUE,
      user_id TEXT,
      email TEXT,
      type TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ─── Challenge Store ─────────────────────────────────────────────────

async function storeChallenge(record: ChallengeRecord) {
  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      await mongo.collection("webauthn_challenges").insertOne({
        ...record,
        createdAt: new Date(),
      });
      return;
    } catch {
      // fall through to SQLite
    }
  }

  await ensureWebAuthnTables();
  const db = await getDatabase();
  db.prepare(
    "INSERT INTO webauthn_challenges (challenge, user_id, email, type, expires_at) VALUES (?, ?, ?, ?, ?)",
  ).run(
    record.challenge,
    record.userId || null,
    record.email || null,
    record.type,
    record.expiresAt.toISOString(),
  );
}

async function consumeChallenge(
  challenge: string,
  type: "registration" | "authentication",
): Promise<ChallengeRecord | null> {
  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const doc = await mongo.collection("webauthn_challenges").findOneAndDelete({
        challenge,
        type,
        expiresAt: { $gt: new Date() },
      });
      if (doc) {
        return {
          challenge: doc["challenge"] as string,
          userId: doc["userId"] as string | undefined,
          email: doc["email"] as string | undefined,
          type: doc["type"] as "registration" | "authentication",
          expiresAt: doc["expiresAt"] as Date,
        };
      }
    } catch {
      // fall through to SQLite
    }
  }

  await ensureWebAuthnTables();
  const db = await getDatabase();
  const row = db
    .prepare(
      "SELECT * FROM webauthn_challenges WHERE challenge = ? AND type = ? AND expires_at > ?",
    )
    .get(challenge, type, new Date().toISOString()) as
    | { challenge: string; user_id: string; email: string; type: string; expires_at: string }
    | undefined;

  if (!row) return null;

  db.prepare("DELETE FROM webauthn_challenges WHERE challenge = ?").run(challenge);

  return {
    challenge: row.challenge,
    userId: row.user_id || undefined,
    email: row.email || undefined,
    type: row.type as "registration" | "authentication",
    expiresAt: new Date(row.expires_at),
  };
}

// ─── Credential Store ────────────────────────────────────────────────

async function storeCredential(userId: string, cred: StoredCredential) {
  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      await mongo.collection("webauthn_credentials").insertOne({
        userId,
        credentialId: cred.credentialId,
        publicKey: cred.publicKey,
        counter: cred.counter,
        transports: cred.transports || [],
        createdAt: new Date(),
      });
      return;
    } catch {
      // fall through
    }
  }

  await ensureWebAuthnTables();
  const db = await getDatabase();
  db.prepare(
    "INSERT OR REPLACE INTO webauthn_credentials (user_id, credential_id, public_key, counter, transports) VALUES (?, ?, ?, ?, ?)",
  ).run(
    userId,
    cred.credentialId,
    cred.publicKey,
    cred.counter,
    JSON.stringify(cred.transports || []),
  );

  try {
    const userRow = db.prepare("SELECT email FROM users WHERE id = ?").get(userId) as { email: string } | undefined;
    if (userRow?.email) {
      const isB64Url = cred.publicKey.includes("-") || cred.publicKey.includes("_");
      const b64url = isB64Url ? cred.publicKey : Buffer.from(cred.publicKey, "base64").toString("base64url");
      db.prepare(`
        INSERT OR REPLACE INTO passkeys (credential_id, email, public_key, counter, transports)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        cred.credentialId,
        userRow.email.toLowerCase().trim(),
        b64url,
        cred.counter,
        JSON.stringify(cred.transports || []),
      );
    }
  } catch {}
}

async function getCredentialsForUser(userId: string): Promise<StoredCredential[]> {
  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const docs = await mongo
        .collection("webauthn_credentials")
        .find({ userId })
        .toArray();
      if (docs.length > 0) {
        return docs.map((d) => ({
          credentialId: d["credentialId"] as string,
          publicKey: d["publicKey"] as string,
          counter: d["counter"] as number,
          transports: (d["transports"] as string[]) || [],
          createdAt: String(d["createdAt"]),
        }));
      }
    } catch {
      // fall through
    }
  }

  await ensureWebAuthnTables();
  const db = await getDatabase();
  const rows = db
    .prepare("SELECT * FROM webauthn_credentials WHERE user_id = ?")
    .all(userId) as Array<{
    credential_id: string;
    public_key: string;
    counter: number;
    transports: string;
    created_at: string;
  }>;

  try {
    const userRow = db.prepare("SELECT email FROM users WHERE id = ?").get(userId) as { email: string } | undefined;
    if (userRow?.email) {
      const pRows = db.prepare("SELECT * FROM passkeys WHERE lower(trim(email)) = ?").all(userRow.email.toLowerCase().trim()) as Array<{
        credential_id: string;
        public_key: string;
        counter: number;
        transports: string;
        created_at: string;
      }>;
      for (const pr of pRows) {
        if (!rows.some((r) => r.credential_id === pr.credential_id)) {
          const isB64Url = pr.public_key.includes("-") || pr.public_key.includes("_");
          const b64 = isB64Url ? Buffer.from(pr.public_key, "base64url").toString("base64") : pr.public_key;
          rows.push({
            credential_id: pr.credential_id,
            public_key: b64,
            counter: pr.counter,
            transports: pr.transports,
            created_at: pr.created_at,
          });
        }
      }
    }
  } catch {}

  return rows.map((r) => ({
    credentialId: r.credential_id,
    publicKey: r.public_key,
    counter: r.counter,
    transports: JSON.parse(r.transports || "[]"),
    createdAt: r.created_at,
  }));
}

async function getCredentialById(credentialId: string): Promise<
  (StoredCredential & { userId: string }) | null
> {
  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const doc = await mongo
        .collection("webauthn_credentials")
        .findOne({ credentialId });
      if (doc) {
        return {
          credentialId: doc["credentialId"] as string,
          publicKey: doc["publicKey"] as string,
          counter: doc["counter"] as number,
          transports: (doc["transports"] as string[]) || [],
          createdAt: String(doc["createdAt"]),
          userId: doc["userId"] as string,
        };
      }
    } catch {
      // fall through
    }
  }

  await ensureWebAuthnTables();
  const db = await getDatabase();
  let row = db
    .prepare("SELECT * FROM webauthn_credentials WHERE credential_id = ?")
    .get(credentialId) as
    | {
        user_id: string;
        credential_id: string;
        public_key: string;
        counter: number;
        transports: string;
        created_at: string;
      }
    | undefined;

  if (!row) {
    try {
      const pRow = db.prepare(`
        SELECT p.credential_id, p.public_key, p.counter, p.transports, p.created_at, u.id as user_id
        FROM passkeys p
        JOIN users u ON lower(trim(u.email)) = lower(trim(p.email))
        WHERE p.credential_id = ?
      `).get(credentialId) as {
        credential_id: string;
        public_key: string;
        counter: number;
        transports: string;
        created_at: string;
        user_id: string | number;
      } | undefined;

      if (pRow) {
        const isB64Url = pRow.public_key.includes("-") || pRow.public_key.includes("_");
        const b64 = isB64Url ? Buffer.from(pRow.public_key, "base64url").toString("base64") : pRow.public_key;
        row = {
          user_id: String(pRow.user_id),
          credential_id: pRow.credential_id,
          public_key: b64,
          counter: pRow.counter,
          transports: pRow.transports,
          created_at: pRow.created_at,
        };
      }
    } catch {}
  }

  if (!row) return null;

  return {
    credentialId: row.credential_id,
    publicKey: row.public_key,
    counter: row.counter,
    transports: JSON.parse(row.transports || "[]"),
    createdAt: row.created_at,
    userId: row.user_id,
  };
}

async function updateCredentialCounter(credentialId: string, newCounter: number) {
  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      await mongo
        .collection("webauthn_credentials")
        .updateOne({ credentialId }, { $set: { counter: newCounter } });
      return;
    } catch {
      // fall through
    }
  }

  await ensureWebAuthnTables();
  const db = await getDatabase();
  db.prepare("UPDATE webauthn_credentials SET counter = ? WHERE credential_id = ?").run(
    newCounter,
    credentialId,
  );
}

// ─── User Lookup Helpers ─────────────────────────────────────────────

async function findUserById(userId: string): Promise<{
  id: string;
  fullName: string;
  email: string;
  role: AccountRole;
  emailVerified: boolean;
  isAdmin: boolean;
} | null> {
  if (isMongoConfigured()) {
    try {
      const { ObjectId } = await import("mongodb");
      const mongo = await getMongoDb();
      let userDoc;
      try {
        userDoc = await mongo.collection("users").findOne({ _id: new ObjectId(userId) });
      } catch {
        userDoc = await mongo.collection("users").findOne({ id: userId });
      }
      if (userDoc) {
        return {
          id: userDoc["_id"].toString(),
          fullName: String(userDoc["fullName"] || userDoc["full_name"]),
          email: String(userDoc["email"]),
          role: userDoc["role"] as AccountRole,
          emailVerified: Boolean(userDoc["emailVerified"] ?? userDoc["email_verified"]),
          isAdmin: isUserAdmin(userDoc),
        };
      }
    } catch {
      // fall through
    }
  }

  const db = await getDatabase();
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as
    | { id: number; full_name: string; email: string; role: string; email_verified: number }
    | undefined;
  if (!row) return null;

  return {
    id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    role: row.role as AccountRole,
    emailVerified: Boolean(row.email_verified),
    isAdmin: isUserAdmin(row as Record<string, unknown>),
  };
}

async function findUserByEmail(email: string): Promise<{
  id: string;
  fullName: string;
  email: string;
  role: AccountRole;
  emailVerified: boolean;
  isAdmin: boolean;
} | null> {
  const normalized = email.toLowerCase().trim();

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const userDoc = await mongo.collection("users").findOne({ email: normalized });
      if (userDoc) {
        return {
          id: userDoc["_id"].toString(),
          fullName: String(userDoc["fullName"] || userDoc["full_name"]),
          email: String(userDoc["email"]),
          role: userDoc["role"] as AccountRole,
          emailVerified: Boolean(userDoc["emailVerified"] ?? userDoc["email_verified"]),
          isAdmin: isUserAdmin(userDoc),
        };
      }
    } catch {
      // fall through
    }
  }

  const db = await getDatabase();
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(normalized) as
    | { id: number; full_name: string; email: string; role: string; email_verified: number }
    | undefined;
  if (!row) return null;

  return {
    id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    role: row.role as AccountRole,
    emailVerified: Boolean(row.email_verified),
    isAdmin: isUserAdmin(row as Record<string, unknown>),
  };
}

// ─── Session Creation Helper ─────────────────────────────────────────

async function createBiometricSession(userId: string, role?: AccountRole): Promise<string> {
  const cryptoMod = await import("node:crypto");
  const token = cryptoMod.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      await mongo.collection("sessions").deleteMany({ expiresAt: { $lte: new Date() } });
      await mongo.collection("sessions").insertOne({
        token,
        userId: userId.toString(),
        role: role || undefined,
        expiresAt,
        createdAt: new Date(),
      });
      setSessionCookie(token, true);
      return token;
    } catch {
      // fall through
    }
  }

  const db = await getDatabase();
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(
    token,
    userId,
    expiresAt.toISOString(),
  );
  setSessionCookie(token, true);
  return token;
}

// ─── Public Handlers ─────────────────────────────────────────────────

/**
 * Step 1 of registration: generate options for the browser.
 * User must already be logged in (via password).
 */
export async function generateBiometricRegistrationOptionsHandler() {
  const { readSessionHandler } = await import("./auth.server");
  const session = await readSessionHandler({});
  if (!session.user) {
    return { ok: false as const, error: "You must be signed in to register biometric credentials." };
  }

  const userId = String(session.user.id);
  const existingCreds = await getCredentialsForUser(userId);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: getRpId(),
    userName: session.user.email,
    userDisplayName: session.user.fullName,
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform", // Force device biometric
      residentKey: "preferred",
      userVerification: "preferred",
    },
    excludeCredentials: existingCreds.map((c) => ({
      id: c.credentialId,
      transports: c.transports,
    })),
  });

  // Store the challenge for verification
  await storeChallenge({
    challenge: options.challenge,
    userId,
    type: "registration",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
  });

  return { ok: true as const, options };
}

/**
 * Step 2 of registration: verify the attestation from the browser.
 */
export async function verifyBiometricRegistrationHandler(data: {
  response: RegistrationResponseJSON;
}) {
  const { readSessionHandler } = await import("./auth.server");
  const session = await readSessionHandler({});
  if (!session.user) {
    return { ok: false as const, error: "You must be signed in to register biometric credentials." };
  }

  const userId = String(session.user.id);

  let verification;
  try {
    // Get the challenge and origin from the clientDataJSON
    const clientDataBuffer = Buffer.from(data.response.response.clientDataJSON, "base64url");
    const clientData = JSON.parse(clientDataBuffer.toString("utf-8"));
    const usedChallenge = clientData.challenge;
    const clientOrigin = typeof clientData.origin === "string" ? clientData.origin : undefined;

    // Consume the specific challenge
    const record = await consumeChallenge(usedChallenge, "registration");
    if (!record || record.userId !== userId) {
      return { ok: false as const, error: "Invalid or expired biometric registration challenge." };
    }

    verification = await verifyRegistrationResponse({
      response: data.response,
      expectedChallenge: usedChallenge,
      expectedOrigin: getExpectedOrigins(clientOrigin),
      expectedRPID: getRpId(clientOrigin),
      requireUserVerification: false,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Biometric registration verification error:", err);
    return { ok: false as const, error: `Biometric verification failed: ${errorMsg}` };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { ok: false as const, error: "Biometric verification failed." };
  }

  const { credential } = verification.registrationInfo;

  // Store the credential
  await storeCredential(userId, {
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString("base64"),
    counter: credential.counter,
    transports: (data.response.response.transports as string[]) ?? [],
    createdAt: new Date().toISOString(),
  });

  return {
    ok: true as const,
    message: "Biometric credential registered successfully! You can now sign in with biometrics.",
  };
}

/**
 * Step 1 of authentication: generate options for the browser.
 * Can be called without being signed in (that's the point!).
 */
export async function generateBiometricAuthOptionsHandler(data: {
  email: string;
  role: AccountRole;
}) {
  const user = await findUserByEmail(data.email);
  if (!user) {
    // Don't reveal whether the account exists
    return {
      ok: false as const,
      error: "No biometric credentials found. Please sign in with your password first and register biometrics in your profile.",
    };
  }

  const credentials = await getCredentialsForUser(user.id);
  if (credentials.length === 0) {
    return {
      ok: false as const,
      error: "No biometric credentials registered for this account. Sign in with your password and register biometrics in Settings.",
    };
  }

  const options = await generateAuthenticationOptions({
    rpID: getRpId(),
    allowCredentials: credentials.map((c) => ({
      id: c.credentialId,
      transports: c.transports,
    })),
    userVerification: "preferred",
  });

  // Store challenge
  await storeChallenge({
    challenge: options.challenge,
    email: data.email.toLowerCase().trim(),
    type: "authentication",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  return { ok: true as const, options, role: data.role };
}

/**
 * Step 2 of authentication: verify the assertion from the browser.
 */
export async function verifyBiometricAuthHandler(data: {
  response: AuthenticationResponseJSON;
  email: string;
  role: AccountRole;
}) {
  const credentialId = data.response.id;
  const storedCred = await getCredentialById(credentialId);

  if (!storedCred) {
    return { ok: false as const, error: "Biometric credential not recognized." };
  }

  const user = await findUserById(storedCred.userId);
  if (!user) {
    return { ok: false as const, error: "User account not found." };
  }

  // Verify the email matches (security check)
  if (user.email.toLowerCase() !== data.email.toLowerCase().trim()) {
    return { ok: false as const, error: "Biometric credential does not match this account." };
  }

  // Role check (admins can use any role)
  if (!user.isAdmin && user.role !== data.role) {
    return { ok: false as const, error: "Biometric credential is not registered for this portal." };
  }

  let verification;
  try {
    // Extract challenge and origin from clientDataJSON
    const clientDataBuffer = Buffer.from(data.response.response.clientDataJSON, "base64url");
    const clientData = JSON.parse(clientDataBuffer.toString("utf-8"));
    const usedChallenge = clientData.challenge;
    const clientOrigin = typeof clientData.origin === "string" ? clientData.origin : undefined;

    // Consume the challenge
    const record = await consumeChallenge(usedChallenge, "authentication");
    if (!record) {
      return { ok: false as const, error: "Invalid or expired biometric challenge." };
    }

    verification = await verifyAuthenticationResponse({
      response: data.response,
      expectedChallenge: usedChallenge,
      expectedOrigin: getExpectedOrigins(clientOrigin),
      expectedRPID: getRpId(clientOrigin),
      credential: {
        id: storedCred.credentialId,
        publicKey: new Uint8Array(Buffer.from(storedCred.publicKey, "base64")),
        counter: storedCred.counter,
        transports: storedCred.transports,
      },
      requireUserVerification: false,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Biometric auth verification error:", err);
    return { ok: false as const, error: `Biometric verification failed: ${errorMsg}` };
  }

  if (!verification.verified) {
    return { ok: false as const, error: "Biometric verification failed." };
  }

  // Update counter
  await updateCredentialCounter(credentialId, verification.authenticationInfo.newCounter);

  // Create session
  const effectiveRole: AccountRole = user.isAdmin ? data.role : user.role;
  const token = await createBiometricSession(user.id, effectiveRole);

  return {
    ok: true as const,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: effectiveRole,
      emailVerified: user.emailVerified,
      isAdmin: user.isAdmin,
    } as AuthUser & { isAdmin: boolean },
    token,
  };
}

/**
 * Check if a user has biometric credentials registered.
 */
export async function hasBiometricCredentialsHandler(data: { email: string }) {
  const user = await findUserByEmail(data.email);
  if (!user) return { ok: true as const, hasBiometrics: false };

  const creds = await getCredentialsForUser(user.id);
  return { ok: true as const, hasBiometrics: creds.length > 0 };
}

/**
 * Check if the current signed-in user has biometric credentials.
 */
export async function myBiometricStatusHandler() {
  const { readSessionHandler } = await import("./auth.server");
  const session = await readSessionHandler({});
  if (!session.user) {
    return { ok: false as const, error: "Not signed in." };
  }

  const creds = await getCredentialsForUser(String(session.user.id));
  return {
    ok: true as const,
    registered: creds.length > 0,
    count: creds.length,
  };
}
