import { describe, it, expect } from "vitest";
import { sanitizeMongoUri } from "@/lib/mongodb.server";

describe("MongoDB Atlas URI Sanitization", () => {
  it("returns null for empty or undefined URI inputs", () => {
    expect(sanitizeMongoUri(null)).toBeNull();
    expect(sanitizeMongoUri(undefined)).toBeNull();
    expect(sanitizeMongoUri("")).toBeNull();
    expect(sanitizeMongoUri("   ")).toBeNull();
  });

  it("strips wrapping quotes from environment variable values", () => {
    const raw = '"mongodb+srv://user:pass@cluster0.abc.mongodb.net/ableo?retryWrites=true"';
    expect(sanitizeMongoUri(raw)).toBe(
      "mongodb+srv://user:pass@cluster0.abc.mongodb.net/ableo?retryWrites=true",
    );
  });

  it("cleans literal angle brackets from password placeholders", () => {
    const raw = "mongodb+srv://user:<secretpassword>@cluster0.abc.mongodb.net/ableo";
    expect(sanitizeMongoUri(raw)).toBe(
      "mongodb+srv://user:secretpassword@cluster0.abc.mongodb.net/ableo",
    );
  });

  it("appends default /ableo database name if query string immediately follows cluster host", () => {
    const raw = "mongodb+srv://user:pass@cluster0.abc.mongodb.net/?retryWrites=true";
    expect(sanitizeMongoUri(raw)).toBe(
      "mongodb+srv://user:pass@cluster0.abc.mongodb.net/ableo?retryWrites=true",
    );
  });
});
