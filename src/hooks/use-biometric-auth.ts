/**
 * Client-side hook for WebAuthn biometric authentication.
 *
 * Wraps the @simplewebauthn/browser API and communicates with
 * the server functions for challenge exchange.
 */

import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import {
  generateBiometricRegistrationOptions,
  verifyBiometricRegistration,
  generateBiometricAuthOptions,
  verifyBiometricAuth,
  hasBiometricCredentials,
  myBiometricStatus,
} from "@/lib/webauthn.functions";
import type { AccountRole, AuthUser } from "@/lib/auth.functions";

type BiometricState = {
  /** Whether the browser supports WebAuthn at all */
  isSupported: boolean;
  /** Whether platform authenticator (biometric) is available */
  isPlatformAvailable: boolean;
  /** Whether the current user has registered biometrics */
  isRegistered: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Last error message */
  error: string | null;
  /** Last success message */
  success: string | null;

  /** Register biometric credential (user must be signed in) */
  registerBiometric: () => Promise<boolean>;

  /** Authenticate with biometric (passwordless login) */
  authenticateWithBiometric: (
    email: string,
    role: AccountRole,
  ) => Promise<{ ok: boolean; user?: AuthUser & { isAdmin?: boolean }; error?: string }>;

  /** Check if a given email has biometric credentials */
  checkBiometricForEmail: (email: string) => Promise<boolean>;

  /** Refresh the registered status */
  refreshStatus: () => Promise<void>;
};

/**
 * Check if WebAuthn is available in the current browser.
 */
function checkWebAuthnSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  );
}

/**
 * Check if a platform authenticator (biometric) is available.
 */
async function checkPlatformAuthenticator(): Promise<boolean> {
  if (!checkWebAuthnSupport()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function useBiometricAuth(): BiometricState {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const genRegOptionsFn = useServerFn(generateBiometricRegistrationOptions);
  const verifyRegFn = useServerFn(verifyBiometricRegistration);
  const genAuthOptionsFn = useServerFn(generateBiometricAuthOptions);
  const verifyAuthFn = useServerFn(verifyBiometricAuth);
  const hasCredsFn = useServerFn(hasBiometricCredentials);
  const myStatusFn = useServerFn(myBiometricStatus);

  // Check browser support on mount
  useEffect(() => {
    const supported = checkWebAuthnSupport();
    setIsSupported(supported);

    if (supported) {
      checkPlatformAuthenticator().then(setIsPlatformAvailable);
    }
  }, []);

  // Check if current user has registered biometrics
  const refreshStatus = useCallback(async () => {
    try {
      const res = await myStatusFn({ data: {} });
      if (res.ok) {
        setIsRegistered(res.registered);
      }
    } catch {
      // Not signed in or error — that's fine
    }
  }, [myStatusFn]);

  useEffect(() => {
    if (isSupported) {
      refreshStatus();
    }
  }, [isSupported, refreshStatus]);

  const registerBiometric = useCallback(async (): Promise<boolean> => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Step 1: Get registration options from server
      const optionsResult = await genRegOptionsFn({ data: {} });
      if (!optionsResult.ok) {
        setError(optionsResult.error || "Failed to generate registration options.");
        return false;
      }

      // Step 2: Create credential via browser API
      const { startRegistration } = await import("@simplewebauthn/browser");
      const attResp = await startRegistration({ optionsJSON: optionsResult.options });

      // Step 3: Verify with server
      const verifyResult = await verifyRegFn({
        data: { response: attResp as unknown as Record<string, unknown> },
      });

      if (!verifyResult.ok) {
        setError(verifyResult.error || "Registration verification failed.");
        return false;
      }

      setSuccess(verifyResult.message || "Biometric registered successfully!");
      setIsRegistered(true);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("cancelled") || msg.includes("AbortError") || msg.includes("NotAllowedError")) {
        setError("Biometric registration was cancelled.");
      } else {
        setError(`Biometric registration failed: ${msg}`);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [genRegOptionsFn, verifyRegFn]);

  const authenticateWithBiometric = useCallback(
    async (
      email: string,
      role: AccountRole,
    ): Promise<{ ok: boolean; user?: AuthUser & { isAdmin?: boolean }; error?: string }> => {
      setError(null);
      setSuccess(null);
      setIsLoading(true);

      try {
        // Step 1: Get authentication options from server
        const optionsResult = await genAuthOptionsFn({ data: { email, role } });
        if (!optionsResult.ok) {
          const errMsg = optionsResult.error || "No biometric credentials found.";
          setError(errMsg);
          return { ok: false, error: errMsg };
        }

        // Step 2: Get assertion via browser biometric
        const { startAuthentication } = await import("@simplewebauthn/browser");
        const assertionResp = await startAuthentication({ optionsJSON: optionsResult.options });

        // Step 3: Verify with server
        const verifyResult = await verifyAuthFn({
          data: {
            response: assertionResp as unknown as Record<string, unknown>,
            email,
            role,
          },
        });

        if (!verifyResult.ok) {
          const errMsg = verifyResult.error || "Biometric authentication failed.";
          setError(errMsg);
          return { ok: false, error: errMsg };
        }

        setSuccess("Biometric authentication successful!");
        return { ok: true, user: verifyResult.user };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        let errMsg: string;
        if (msg.includes("cancelled") || msg.includes("AbortError") || msg.includes("NotAllowedError")) {
          errMsg = "Biometric authentication was cancelled.";
        } else {
          errMsg = `Biometric authentication failed: ${msg}`;
        }
        setError(errMsg);
        return { ok: false, error: errMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [genAuthOptionsFn, verifyAuthFn],
  );

  const checkBiometricForEmail = useCallback(
    async (email: string): Promise<boolean> => {
      try {
        const res = await hasCredsFn({ data: { email } });
        return res.ok && res.hasBiometrics;
      } catch {
        return false;
      }
    },
    [hasCredsFn],
  );

  return {
    isSupported,
    isPlatformAvailable,
    isRegistered,
    isLoading,
    error,
    success,
    registerBiometric,
    authenticateWithBiometric,
    checkBiometricForEmail,
    refreshStatus,
  };
}
