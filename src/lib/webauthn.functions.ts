/**
 * TanStack server function wrappers for WebAuthn (biometric) operations.
 *
 * Return types are cast through JSON.parse(JSON.stringify()) to ensure
 * TanStack's serialization check passes — the upstream WebAuthn types
 * include deep BufferSource unions that fail exact optional property checks.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJSON = any;

export const generateBiometricRegistrationOptions = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({}).default({}).parse(data ?? {}))
  .handler(async (): Promise<AnyJSON> => {
    const { generateBiometricRegistrationOptionsHandler } = await import("./webauthn.server");
    const result = await generateBiometricRegistrationOptionsHandler();
    return JSON.parse(JSON.stringify(result));
  });

export const verifyBiometricRegistration = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        response: z.record(z.string(), z.unknown()),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<AnyJSON> => {
    const { verifyBiometricRegistrationHandler } = await import("./webauthn.server");
    return verifyBiometricRegistrationHandler({ response: data.response as AnyJSON });
  });

export const generateBiometricAuthOptions = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        email: z.string().trim().email(),
        role: z.enum(["candidate", "employer"]),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<AnyJSON> => {
    const { generateBiometricAuthOptionsHandler } = await import("./webauthn.server");
    const result = await generateBiometricAuthOptionsHandler(data);
    return JSON.parse(JSON.stringify(result));
  });

export const verifyBiometricAuth = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        response: z.record(z.string(), z.unknown()),
        email: z.string().trim().email(),
        role: z.enum(["candidate", "employer"]),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<AnyJSON> => {
    const { verifyBiometricAuthHandler } = await import("./webauthn.server");
    return verifyBiometricAuthHandler({
      response: data.response as AnyJSON,
      email: data.email,
      role: data.role,
    });
  });

export const hasBiometricCredentials = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ email: z.string().trim().email() }).parse(data),
  )
  .handler(async ({ data }): Promise<AnyJSON> => {
    const { hasBiometricCredentialsHandler } = await import("./webauthn.server");
    return hasBiometricCredentialsHandler(data);
  });

export const myBiometricStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({}).default({}).parse(data ?? {}))
  .handler(async (): Promise<AnyJSON> => {
    const { myBiometricStatusHandler } = await import("./webauthn.server");
    return myBiometricStatusHandler();
  });
