import { MongoClient, type Db, type Collection } from "mongodb";

/**
 * MongoDB Atlas Connection Manager for Ableo
 * Provides pooled singleton client and collection helpers for server functions.
 */

let cachedClient: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export const DEFAULT_DB_NAME = "ableo";

export function sanitizeMongoUri(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let uri = raw.trim();
  // Strip quotes if wrapped
  uri = uri.replace(/^['"]|['"]$/g, "");
  // Fix literal <password> brackets if left from Atlas template: mongodb+srv://user:<pass>@
  uri = uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)<([^>]+)>(@)/, "$1$2$3");
  // If no db path specified before ?, insert /ableo
  if (/^mongodb(?:\+srv)?:\/\/[^/]+\/(\?.*)?$/.test(uri)) {
    uri = uri.replace(/^mongodb(?:\+srv)?:\/\/[^/]+\//, (match) => match + DEFAULT_DB_NAME);
  }
  return uri;
}

export function getMongoUri(): string | null {
  const raw =
    process.env["MONGODB_URI"] ||
    process.env["MONGO_URI"] ||
    process.env["MONGODB_URL"] ||
    null;
  return sanitizeMongoUri(raw);
}

export function isMongoConfigured(): boolean {
  const uri = getMongoUri();
  return Boolean(uri && uri.trim().startsWith("mongodb"));
}

export async function getMongoClient(): Promise<MongoClient> {
  const uri = getMongoUri();
  if (!uri) {
    throw new Error(
      "MONGODB_URI environment variable is missing. Please add your MongoDB Atlas connection string to .env."
    );
  }

  if (cachedClient) {
    return cachedClient;
  }

  if (!clientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    clientPromise = client.connect().then((connectedClient) => {
      cachedClient = connectedClient;
      // Initialize indexes in the background
      void initMongoIndexes(connectedClient.db(getDatabaseName(uri)));
      return connectedClient;
    });
  }

  return clientPromise;
}

function getDatabaseName(uri: string): string {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\//, "");
    if (pathname && !pathname.includes("?")) {
      return pathname;
    }
  } catch {
    // If not a standard URL, fallback
  }
  return process.env["MONGODB_DB_NAME"] || DEFAULT_DB_NAME;
}

export async function getMongoDb(): Promise<Db> {
  const uri = getMongoUri();
  if (!uri) throw new Error("MONGODB_URI not configured");
  const client = await getMongoClient();
  return client.db(getDatabaseName(uri));
}

export async function checkMongoConnection(): Promise<{
  connected: boolean;
  dbName?: string;
  cluster?: string;
  error?: string;
}> {
  if (!isMongoConfigured()) {
    return {
      connected: false,
      error: "MONGODB_URI environment variable is not configured in .env",
    };
  }

  try {
    const client = await getMongoClient();
    const db = await getMongoDb();
    await db.command({ ping: 1 });
    return {
      connected: true,
      dbName: db.databaseName,
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Failed to reach MongoDB Atlas cluster";
    return {
      connected: false,
      error,
    };
  }
}

async function initMongoIndexes(db: Db): Promise<void> {
  try {
    // Users: unique email
    await db.collection("users").createIndex({ email: 1 }, { unique: true });

    // Sessions: token index
    await db.collection("sessions").createIndex({ token: 1 }, { unique: true });

    // Password resets: token index
    await db.collection("password_resets").createIndex({ token: 1 }, { unique: true });

    // Login attempts: key index
    await db.collection("login_attempts").createIndex({ key: 1 }, { unique: true });

    // AI rate limits: key index
    await db.collection("ai_rate_limits").createIndex({ key: 1 }, { unique: true });
  } catch (err) {
    console.warn("MongoDB Atlas: index initialization note:", err);
  }
}

// Typed collection accessors
export async function getUsersCollection(): Promise<Collection> {
  const db = await getMongoDb();
  return db.collection("users");
}

export async function getSessionsCollection(): Promise<Collection> {
  const db = await getMongoDb();
  return db.collection("sessions");
}

export async function getJobsCollection(): Promise<Collection> {
  const db = await getMongoDb();
  return db.collection("jobs");
}

export async function getApplicationsCollection(): Promise<Collection> {
  const db = await getMongoDb();
  return db.collection("applications");
}
