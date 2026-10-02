import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AccountRole = "candidate" | "employer";
export type AuthUser = {
  id: number | string;
  fullName: string;
  email: string;
  role: AccountRole;
  emailVerified?: boolean;
  isAdmin?: boolean;
};

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
    const { registerAccountHandler } = await import("./auth.server");
    return registerAccountHandler(data);
  });

export const loginAccount = createServerFn({ method: "POST" })
  .validator((data) => credentials.parse(data))
  .handler(async ({ data }) => {
    const { loginAccountHandler } = await import("./auth.server");
    return loginAccountHandler(data);
  });

export const readSession = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({ token: z.string().optional() })
      .default({})
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { readSessionHandler } = await import("./auth.server");
    return readSessionHandler(data);
  });

export const logoutAccount = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({ token: z.string().optional() })
      .default({})
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { logoutAccountHandler } = await import("./auth.server");
    return logoutAccountHandler(data);
  });

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator((data) => z.object({ email: z.string().trim().email().max(254) }).parse(data))
  .handler(async ({ data }) => {
    const { requestPasswordResetHandler } = await import("./auth.server");
    return requestPasswordResetHandler(data);
  });

export const confirmPasswordReset = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        token: z.string().trim().min(16, "Enter your reset token").max(128),
        newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { confirmPasswordResetHandler } = await import("./auth.server");
    return confirmPasswordResetHandler(data);
  });

export const requestEmailVerification = createServerFn({ method: "POST" })
  .validator((data) => z.object({ email: z.string().trim().email() }).parse(data))
  .handler(async ({ data }) => {
    const { requestEmailVerificationHandler } = await import("./auth.server");
    return requestEmailVerificationHandler(data);
  });

export const verifyEmail = createServerFn({ method: "POST" })
  .validator((data) =>
    z.object({ email: z.string().trim().email(), code: z.string().min(4) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { verifyEmailHandler } = await import("./auth.server");
    return verifyEmailHandler(data);
  });

export const getDatabaseStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getDatabaseStatusHandler } = await import("./auth.server");
  return getDatabaseStatusHandler();
});

export const getUserProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        token: z.string().optional(),
        email: z.string().email().optional(),
      })
      .default({})
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { getUserProfileHandler } = await import("./auth.server");
    return getUserProfileHandler(data);
  });

export const saveUserProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        profile: z.record(z.string(), z.unknown()),
        token: z.string().optional(),
        email: z.string().email().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { saveUserProfileHandler } = await import("./auth.server");
    return saveUserProfileHandler(data);
  });
