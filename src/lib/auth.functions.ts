import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AccountRole = "candidate" | "employer";
export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: AccountRole;
  emailVerified?: boolean;
};

type UserRow = {
  id: number;
  full_name: string;
  email: string;
  role: AccountRole;
  password_hash: string;
  password_salt: string;
  email_verified?: number;
};

type SqliteDatabase = import("better-sqlite3").Database;
let databasePromise: Promise<SqliteDatabase> | undefined;

// These imports are only evaluated by server-function handlers. Keeping them
// analyzable lets TanStack Start split them out of the browser module.
async function getDatabase(): Promise<SqliteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const [sqliteModule, fsModule, pathModule] = await Promise.all([
        import("better-sqlite3"),
        import("node:fs"),
        import("node:path"),
      ]);
      const databasePath =
        process.env["ABLEO_AUTH_DB"] ??
        pathModule.join(process.cwd(), "data", "ableo-auth.sqlite");
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

async function createSession(db: SqliteDatabase, userId: number) {
  const token = (await crypto()).randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(
    token,
    userId,
    expiresAt
  );
  return token;
}

const COOKIE_NAME = "ableo_session";

async function setSessionCookie(token: string) {
  try {
    const { setCookie } = await import("@tanstack/react-start/server");
    setCookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });
  } catch (err) {
    console.error("Could not set session cookie:", err);
  }
}

async function clearSessionCookie() {
  try {
    const { deleteCookie } = await import("@tanstack/react-start/server");
    deleteCookie(COOKIE_NAME, {
      path: "/",
    });
  } catch (err) {
    console.error("Could not clear session cookie:", err);
  }
}

async function getSessionCookieToken(): Promise<string | null> {
  try {
    const { getCookie } = await import("@tanstack/react-start/server");
    const val = getCookie(COOKIE_NAME);
    return typeof val === "string" ? val : null;
  } catch {
    return null;
  }
}

async function getClientIp(): Promise<string> {
  try {
    const { getRequestIP, getRequestHeader } = await import("@tanstack/react-start/server");
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

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: z.enum(["candidate", "employer"]),
});

const registration = credentials.extend({
  fullName: z.string().trim().min(2, "Enter your name").max(100),
});

export const registerAccount = createServerFn({ method: "POST" })
  .validator((data) => registration.parse(data))
  .handler(async ({ data }) => {
    const db = await getDatabase();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(data.email) as
      | { id: number }
      | undefined;
    if (existing) {
      return { ok: false as const, error: "An account already exists for this email address." };
    }
    const salt = (await crypto()).randomBytes(16).toString("hex");
    const result = db
      .prepare(
        "INSERT INTO users (full_name, email, role, password_hash, password_salt, email_verified) VALUES (?, ?, ?, ?, ?, 0)"
      )
      .run(data.fullName, data.email.toLowerCase(), data.role, await passwordHash(data.password, salt), salt);
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as UserRow;
    const token = await createSession(db, row.id);
    await setSessionCookie(token);
    return { ok: true as const, user: publicUser(row), token };
  });

function recordFailedLoginAttempt(db: SqliteDatabase, key: string): number {
  const row = db.prepare("SELECT attempts FROM login_attempts WHERE key = ?").get(key) as
    | { attempts: number }
    | undefined;
  const newAttempts = (row?.attempts ?? 0) + 1;
  let lockUntil: string | null = null;
  if (newAttempts >= 5) {
    // 15-minute temporary lockout
    lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  }
  db.prepare(`
    INSERT INTO login_attempts (key, attempts, lock_until, last_attempt)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      attempts = excluded.attempts,
      lock_until = excluded.lock_until,
      last_attempt = excluded.last_attempt
  `).run(key, newAttempts, lockUntil, new Date().toISOString());
  return newAttempts;
}

export const loginAccount = createServerFn({ method: "POST" })
  .validator((data) => credentials.parse(data))
  .handler(async ({ data }) => {
    const db = await getDatabase();
    const ip = await getClientIp();
    const ipKey = `ip:${ip}`;
    const emailKey = `email:${data.email.toLowerCase()}`;
    const nowIso = new Date().toISOString();

    // Check brute-force lockouts
    const ipLock = db
      .prepare("SELECT attempts, lock_until FROM login_attempts WHERE key = ? AND lock_until > ?")
      .get(ipKey, nowIso) as { attempts: number; lock_until: string } | undefined;
    const emailLock = db
      .prepare("SELECT attempts, lock_until FROM login_attempts WHERE key = ? AND lock_until > ?")
      .get(emailKey, nowIso) as { attempts: number; lock_until: string } | undefined;

    if (ipLock || emailLock) {
      const lockUntil = ipLock ? new Date(ipLock.lock_until) : new Date(emailLock!.lock_until);
      const remainingMinutes = Math.max(1, Math.ceil((lockUntil.getTime() - Date.now()) / (60 * 1000)));
      return {
        ok: false as const,
        error: `Too many failed login attempts. Temporarily locked for security. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} or reset your password.`,
      };
    }

    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(data.email) as UserRow | undefined;
    let authFailed = false;

    if (!row || row.role !== data.role) {
      authFailed = true;
    } else {
      const expected = Buffer.from(row.password_hash, "hex");
      const supplied = Buffer.from(await passwordHash(data.password, row.password_salt), "hex");
      if (expected.length !== supplied.length || !(await crypto()).timingSafeEqual(expected, supplied)) {
        authFailed = true;
      }
    }

    if (authFailed) {
      const ipAttempts = recordFailedLoginAttempt(db, ipKey);
      const emailAttempts = recordFailedLoginAttempt(db, emailKey);
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

    // Success: clear brute force counters
    db.prepare("DELETE FROM login_attempts WHERE key IN (?, ?)").run(ipKey, emailKey);

    const token = await createSession(db, row!.id);
    await setSessionCookie(token);
    return { ok: true as const, user: publicUser(row!), token };
  });

export const readSession = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ token: z.string().optional() }).default({}).parse(data ?? {}))
  .handler(async ({ data }) => {
    const cookieToken = await getSessionCookieToken();
    const token = cookieToken || data.token;
    if (!token) return { user: null };

    const db = await getDatabase();
    const row = db
      .prepare(
        "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > ?"
      )
      .get(token, new Date().toISOString()) as UserRow | undefined;

    if (!row) {
      if (cookieToken) await clearSessionCookie();
      return { user: null };
    }

    return { user: publicUser(row) };
  });

export const logoutAccount = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ token: z.string().optional() }).default({}).parse(data ?? {}))
  .handler(async ({ data }) => {
    const cookieToken = await getSessionCookieToken();
    const token = cookieToken || data.token;
    const db = await getDatabase();
    if (token) {
      db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    }
    await clearSessionCookie();
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ */
/*  Password Reset                                                    */
/* ------------------------------------------------------------------ */

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator((data) => z.object({ email: z.string().trim().email().max(254) }).parse(data))
  .handler(async ({ data }) => {
    const db = await getDatabase();
    const user = db.prepare("SELECT id, email FROM users WHERE email = ?").get(data.email.toLowerCase()) as
      | { id: number; email: string }
      | undefined;

    if (!user) {
      // Don't leak whether account exists
      return {
        ok: true as const,
        message: "If an account exists with this email address, a password reset token has been generated.",
      };
    }

    const resetToken = (await crypto()).randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    db.prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)").run(
      data.email.toLowerCase(),
      resetToken,
      expiresAt
    );

    return {
      ok: true as const,
      message: "Password reset instructions generated successfully.",
      resetToken, // Provided for immediate reset verification in local/demo environment
    };
  });

export const confirmPasswordReset = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        token: z.string().length(64),
        newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const db = await getDatabase();
    const resetRow = db
      .prepare(
        "SELECT * FROM password_resets WHERE token = ? AND expires_at > ? AND used_at IS NULL"
      )
      .get(data.token, new Date().toISOString()) as { id: number; email: string } | undefined;

    if (!resetRow) {
      return {
        ok: false as const,
        error: "Invalid or expired password reset link. Please request a new reset code.",
      };
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(resetRow.email) as UserRow | undefined;
    if (!user) {
      return { ok: false as const, error: "User account not found." };
    }

    const newSalt = (await crypto()).randomBytes(16).toString("hex");
    const newHash = await passwordHash(data.newPassword, newSalt);
    db.prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?").run(
      newHash,
      newSalt,
      user.id
    );
    db.prepare("UPDATE password_resets SET used_at = ? WHERE id = ?").run(new Date().toISOString(), resetRow.id);

    // Invalidate all old sessions for this user
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
    // Clear failed login attempts lockouts for this email
    db.prepare("DELETE FROM login_attempts WHERE key LIKE ?").run(`email:${user.email.toLowerCase()}`);

    // Create fresh session and set HttpOnly cookie
    const sessionToken = await createSession(db, user.id);
    await setSessionCookie(sessionToken);
    return { ok: true as const, user: publicUser(user), token: sessionToken };
  });

/* ------------------------------------------------------------------ */
/*  Email Verification                                                */
/* ------------------------------------------------------------------ */

export const requestEmailVerification = createServerFn({ method: "POST" })
  .validator((data) => z.object({ email: z.string().trim().email() }).parse(data))
  .handler(async ({ data }) => {
    const db = await getDatabase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    db.prepare("INSERT INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?)").run(
      data.email.toLowerCase(),
      code,
      expiresAt
    );
    return { ok: true as const, message: "Verification code generated.", code };
  });

export const verifyEmail = createServerFn({ method: "POST" })
  .validator((data) => z.object({ email: z.string().trim().email(), code: z.string().min(4) }).parse(data))
  .handler(async ({ data }) => {
    const db = await getDatabase();
    const row = db
      .prepare(
        "SELECT * FROM email_verifications WHERE email = ? AND code = ? AND expires_at > ?"
      )
      .get(data.email.toLowerCase(), data.code.trim(), new Date().toISOString()) as
      | { id: number }
      | undefined;

    if (!row) {
      return { ok: false as const, error: "Invalid or expired verification code." };
    }

    db.prepare("UPDATE users SET email_verified = 1 WHERE email = ?").run(data.email.toLowerCase());
    db.prepare("DELETE FROM email_verifications WHERE id = ?").run(row.id);
    return { ok: true as const, message: "Email successfully verified!" };
  });

/* ------------------------------------------------------------------ */
/*  AI Authentication & Rate Limiting                                 */
/* ------------------------------------------------------------------ */

export async function verifyAiAuthAndRateLimit(): Promise<
  { ok: true; user: AuthUser; ip: string } | { ok: false; error: string }
> {
  const token = await getSessionCookieToken();
  if (!token) {
    return {
      ok: false,
      error: "Authentication required: Please sign in to your Ableo account to access AI features.",
    };
  }

  const db = await getDatabase();
  const row = db
    .prepare(
      "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > ?"
    )
    .get(token, new Date().toISOString()) as UserRow | undefined;

  if (!row) {
    await clearSessionCookie();
    return {
      ok: false,
      error: "Your session has expired or is invalid. Please sign in again to access AI features.",
    };
  }

  const ip = await getClientIp();

  // Enforce sliding window rate limits:
  // 1) Per-user limit: 20 requests per 5 minutes
  // 2) Per-IP limit: 30 requests per 5 minutes
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const cutoffIso = new Date(now - windowMs).toISOString();

  // Clean up expired window entries
  db.prepare("DELETE FROM ai_rate_limits WHERE window_start < ?").run(cutoffIso);

  const userKey = `user:${row.id}`;
  const ipKey = `ip:${ip}`;

  const userRec = db
    .prepare("SELECT count, window_start FROM ai_rate_limits WHERE key = ?")
    .get(userKey) as { count: number; window_start: string } | undefined;
  const ipRec = db
    .prepare("SELECT count, window_start FROM ai_rate_limits WHERE key = ?")
    .get(ipKey) as { count: number; window_start: string } | undefined;

  const USER_LIMIT = 20;
  const IP_LIMIT = 30;

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

  // Increment usage
  db.prepare(`
    INSERT INTO ai_rate_limits (key, count, window_start)
    VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = count + 1
  `).run(userKey, userRec ? userRec.window_start : new Date().toISOString());

  db.prepare(`
    INSERT INTO ai_rate_limits (key, count, window_start)
    VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = count + 1
  `).run(ipKey, ipRec ? ipRec.window_start : new Date().toISOString());

  return { ok: true, user: publicUser(row), ip };
}
