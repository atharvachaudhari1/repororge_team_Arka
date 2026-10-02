import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AccountRole = "candidate" | "employer";
export type AuthUser = { id: number; fullName: string; email: string; role: AccountRole };

type UserRow = { id: number; full_name: string; email: string; role: AccountRole; password_hash: string; password_salt: string };
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
      const databasePath = process.env["ABLEO_AUTH_DB"] ?? pathModule.join(process.cwd(), "data", "ableo-auth.sqlite");
      fsModule.mkdirSync(pathModule.dirname(databasePath), { recursive: true });
      const db = new sqliteModule.default(databasePath);
      db.pragma("journal_mode = WAL");
      db.exec(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        role TEXT NOT NULL CHECK (role IN ('candidate', 'employer')),
        password_hash TEXT NOT NULL, password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      ); CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`);
      return db;
    })();
  }
  return databasePromise;
}

async function crypto() { return import("node:crypto"); }
function publicUser(row: UserRow): AuthUser { return { id: row.id, fullName: row.full_name, email: row.email, role: row.role }; }
async function passwordHash(password: string, salt: string) { return (await crypto()).scryptSync(password, salt, 64).toString("hex"); }
async function createSession(db: SqliteDatabase, userId: number) {
  const token = (await crypto()).randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expiresAt);
  return token;
}

const credentials = z.object({ email: z.string().trim().email("Enter a valid email address").max(254), password: z.string().min(8, "Password must be at least 8 characters").max(128), role: z.enum(["candidate", "employer"]) });
const registration = credentials.extend({ fullName: z.string().trim().min(2, "Enter your name").max(100) });

export const registerAccount = createServerFn({ method: "POST" }).validator((data) => registration.parse(data)).handler(async ({ data }) => {
  const db = await getDatabase();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(data.email) as { id: number } | undefined;
  if (existing) return { ok: false as const, error: "An account already exists for this email address." };
  const salt = (await crypto()).randomBytes(16).toString("hex");
  const result = db.prepare("INSERT INTO users (full_name, email, role, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)").run(data.fullName, data.email.toLowerCase(), data.role, await passwordHash(data.password, salt), salt);
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as UserRow;
  return { ok: true as const, user: publicUser(row), token: await createSession(db, row.id) };
});

export const loginAccount = createServerFn({ method: "POST" }).validator((data) => credentials.parse(data)).handler(async ({ data }) => {
  const db = await getDatabase();
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(data.email) as UserRow | undefined;
  if (!row || row.role !== data.role) return { ok: false as const, error: "Incorrect email, password, or portal." };
  const expected = Buffer.from(row.password_hash, "hex");
  const supplied = Buffer.from(await passwordHash(data.password, row.password_salt), "hex");
  if (expected.length !== supplied.length || !(await crypto()).timingSafeEqual(expected, supplied)) return { ok: false as const, error: "Incorrect email, password, or portal." };
  return { ok: true as const, user: publicUser(row), token: await createSession(db, row.id) };
});

export const readSession = createServerFn({ method: "POST" }).validator((data) => z.object({ token: z.string().length(64) }).parse(data)).handler(async ({ data }) => {
  const db = await getDatabase();
  const row = db.prepare("SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > ?").get(data.token, new Date().toISOString()) as UserRow | undefined;
  return { user: row ? publicUser(row) : null };
});

export const logoutAccount = createServerFn({ method: "POST" }).validator((data) => z.object({ token: z.string().length(64) }).parse(data)).handler(async ({ data }) => {
  const db = await getDatabase();
  db.prepare("DELETE FROM sessions WHERE token = ?").run(data.token);
  return { ok: true as const };
});
