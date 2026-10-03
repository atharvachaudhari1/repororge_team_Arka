import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Building2,
  UserRound,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  MailCheck,
  RotateCw,
  Fingerprint,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import {
  requestPasswordReset,
  confirmPasswordReset,
  requestEmailVerification,
  verifyEmail,
  beginPasskeyLogin,
  finishPasskeyLogin,
  beginPasskeyRegistration,
  finishPasskeyRegistration,
  directCameraDemoLogin,
  type AccountRole,
} from "@/lib/auth.functions";

export type LoginSearch = {
  role?: "candidate" | "employer" | undefined;
  redirect?: string | undefined;
  token?: string | undefined;
  email?: string | undefined;
  mode?: "login" | "register" | "forgot_password" | "verify_email" | undefined;
};

type BiometricChoice = "face" | "fingerprint" | "skip";

function getRequestError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    role: search["role"] === "employer" ? "employer" : "candidate",
    redirect: isSafeReturnTo(search["redirect"]) ? search["redirect"] : undefined,
    token: typeof search["token"] === "string" ? search["token"] : undefined,
    email: typeof search["email"] === "string" ? search["email"] : undefined,
    mode:
      search["mode"] === "verify_email"
        ? "verify_email"
        : search["mode"] === "forgot_password"
          ? "forgot_password"
          : search["mode"] === "register"
            ? "register"
            : undefined,
  }),
  component: LoginPage,
});

function isSafeReturnTo(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/login")
  );
}

function LoginPage() {
  const {
    role: searchRole,
    redirect,
    token: searchToken,
    email: searchEmail,
    mode: searchMode,
  } = Route.useSearch();
  const initialRole: AccountRole = searchRole === "employer" ? "employer" : "candidate";
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const requestResetFn = useServerFn(requestPasswordReset);
  const confirmResetFn = useServerFn(confirmPasswordReset);
  const requestVerificationFn = useServerFn(requestEmailVerification);
  const verifyEmailFn = useServerFn(verifyEmail);
  const beginPasskeyLoginFn = useServerFn(beginPasskeyLogin);
  const finishPasskeyLoginFn = useServerFn(finishPasskeyLogin);
  const beginPasskeyRegistrationFn = useServerFn(beginPasskeyRegistration);
  const finishPasskeyRegistrationFn = useServerFn(finishPasskeyRegistration);
  const directCameraDemoLoginFn = useServerFn(directCameraDemoLogin);

  const [role, setRole] = useState<AccountRole>(initialRole);
  const [mode, setMode] = useState<"login" | "register" | "forgot_password" | "verify_email">(
    searchMode || (searchToken ? "forgot_password" : "login"),
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(searchEmail || "");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState(searchToken || "");
  const [resetSent, setResetSent] = useState(Boolean(searchToken));
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biometricChoice, setBiometricChoice] = useState<BiometricChoice>("fingerprint");
  const [setUpBiometricAfterPassword, setSetUpBiometricAfterPassword] = useState(false);
  const [pendingBiometricSetup, setPendingBiometricSetup] = useState(false);
  const [isDirectEyeLogin, setIsDirectEyeLogin] = useState(false);
  const [pendingRole, setPendingRole] = useState<AccountRole>(initialRole);
  const [eyeCheckComplete, setEyeCheckComplete] = useState(false);
  const [eyeCheckStatus, setEyeCheckStatus] = useState("");
  const eyeVideoRef = useRef<HTMLVideoElement>(null);
  const eyeStreamRef = useRef<MediaStream | null>(null);
  const eyeCheckFrameRef = useRef<number | null>(null);
  const autoStartEyeCheckRef = useRef(false);

  const stopEyeCamera = useCallback(() => {
    if (eyeCheckFrameRef.current !== null) {
      cancelAnimationFrame(eyeCheckFrameRef.current);
      eyeCheckFrameRef.current = null;
    }
    eyeStreamRef.current?.getTracks().forEach((track) => track.stop());
    eyeStreamRef.current = null;
    if (eyeVideoRef.current) eyeVideoRef.current.srcObject = null;
  }, []);

  useEffect(() => stopEyeCamera, [stopEyeCamera]);

  const enrollPasskey = async (choice: Exclude<BiometricChoice, "skip">) => {
    if (!window.PublicKeyCredential) return false;
    const begin = (await beginPasskeyRegistrationFn({ data: {} })) as {
      ok: boolean;
      error: string | null;
      optionsJson: string | null;
    };
    if (!begin.ok) return false;
    const { startRegistration } = await import("@simplewebauthn/browser");
    // WebAuthn intentionally lets the device choose its available authenticator.
    // The selected option below tells the person what to use in that prompt;
    // biometric templates never reach this application.
    const response = await startRegistration({ optionsJSON: JSON.parse(begin.optionsJson!) });
    const finish = await finishPasskeyRegistrationFn({ data: { response } });
    return finish.ok;
  };

  const startEyeCheck = useCallback(async () => {
    setError("");
    setEyeCheckComplete(false);
    setEyeCheckStatus("Opening your camera…");
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera verification requires HTTPS (or localhost) and a supported browser.",
        );
      }
      stopEyeCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      eyeStreamRef.current = stream;
      const video = eyeVideoRef.current;
      if (!video) throw new Error("Camera preview could not be started.");
      video.srcObject = stream;
      await video.play();
      setEyeCheckStatus("Looking for your eyes…");
      const { getFaceLandmarker } = await import("@/lib/eye-tracking/face-landmarker-wrapper");
      const landmarker = await getFaceLandmarker();

      const inspectFrame = () => {
        if (!eyeStreamRef.current || !eyeVideoRef.current) return;
        try {
          const result = landmarker.detectForVideo(eyeVideoRef.current, performance.now());
          const landmarks = result.faceLandmarks?.[0];
          // MediaPipe's iris centres are indexes 468 and 473 when both eyes are visible.
          if (landmarks?.[468] && landmarks?.[473]) {
            setEyeCheckComplete(true);
            setEyeCheckStatus(
              biometricChoice === "face"
                ? "Eyes detected. Click below to complete sign-in."
                : "Eyes detected. Continue to secure passkey setup.",
            );
            stopEyeCamera();
            return;
          }
        } catch {
          // Keep the preview open and try the next camera frame.
        }
        eyeCheckFrameRef.current = requestAnimationFrame(inspectFrame);
      };
      eyeCheckFrameRef.current = requestAnimationFrame(inspectFrame);
    } catch (cameraError) {
      stopEyeCamera();
      setEyeCheckStatus("");
      setError(
        getRequestError(
          cameraError,
          "We couldn't access your camera. Check permission and try again.",
        ),
      );
    }
  }, [biometricChoice, stopEyeCamera]);

  useEffect(() => {
    if (autoStartEyeCheckRef.current && pendingBiometricSetup && biometricChoice === "face") {
      autoStartEyeCheckRef.current = false;
      void startEyeCheck();
    }
  }, [pendingBiometricSetup, biometricChoice, startEyeCheck]);

  const startDirectEyeSignIn = () => {
    if (!email.trim()) {
      setError("Please enter your email first to sign in with camera eye check.");
      return;
    }
    setError("");
    setPendingRole(role);
    setBiometricChoice("face");
    setEyeCheckComplete(false);
    setEyeCheckStatus("");
    setIsDirectEyeLogin(true);
    setPendingBiometricSetup(true);
    autoStartEyeCheckRef.current = true;
  };

  const finishBiometricSetup = async () => {
    if (biometricChoice === "face") {
      if (!eyeCheckComplete) {
        setError("Open the camera and complete the eye check before continuing.");
        return;
      }
      setError("");
      setIsSubmitting(true);
      try {
        const res = await directCameraDemoLoginFn({
          data: { email: email.trim(), role: pendingRole },
        });
        if (!res.ok || !res.user) {
          setError(res.error ?? "Camera eye check sign-in failed.");
          return;
        }
        stopEyeCamera();
        if (redirect) {
          window.location.assign(redirect);
          return;
        }
        window.location.assign(res.user.role === "employer" ? "/employer" : "/dashboard");
      } catch (cameraLoginError) {
        setError(getRequestError(cameraLoginError, "Camera eye check sign-in failed."));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!window.PublicKeyCredential) {
      setError(
        "This browser does not support device biometric sign-in. Use a current browser or choose Do this later.",
      );
      return;
    }
    let supportsPlatformBiometric: boolean | undefined;
    try {
      supportsPlatformBiometric =
        await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();
    } catch {
      setError(
        "This browser could not check device biometric support. Try a current version of Chrome, Edge, Safari, or Firefox.",
      );
      return;
    }
    if (supportsPlatformBiometric === false) {
      setError(
        "No device biometric unlock is set up. Configure Windows Hello, Face ID, or a fingerprint in your device settings, then try again.",
      );
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const enrolled = await enrollPasskey(biometricChoice as Exclude<BiometricChoice, "skip">);
      if (!enrolled) {
        setError(
          "Your device could not create a passkey. You can continue and set it up later from a supported device.",
        );
        return;
      }
      if (redirect) {
        window.location.assign(redirect);
        return;
      }
      navigate({ to: pendingRole === "employer" ? "/employer" : "/dashboard" });
    } catch (passkeyError) {
      const details = getRequestError(passkeyError, "").toLowerCase();
      setError(
        details.includes("timed out") || details.includes("not allowed")
          ? "The device biometric prompt expired or was dismissed. Select Continue again, then approve the Windows Hello, Face ID, or fingerprint prompt within two minutes."
          : "Biometric setup could not be completed. Select Continue to try again, or choose Do this later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const signInWithBiometric = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const begin = (await beginPasskeyLoginFn({ data: { email: email.trim() } })) as {
        ok: boolean;
        error: string | null;
        optionsJson: string | null;
      };
      if (!begin.ok) {
        setError(begin.error ?? "Biometric sign-in failed.");
        return;
      }
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const response = await startAuthentication({ optionsJSON: JSON.parse(begin.optionsJson!) });
      const finish = await finishPasskeyLoginFn({ data: { email: email.trim(), role, response } });
      if (!finish.ok || !finish.user) {
        setError(finish.error ?? "Biometric sign-in failed.");
        return;
      }
      navigate({ to: finish.user.role === "employer" ? "/employer" : "/dashboard" });
    } catch (biometricError) {
      const details = getRequestError(biometricError, "");
      setError(
        details.includes("timed out") || details.includes("not allowed")
          ? "No completed biometric prompt was available. Sign in with your password, then choose biometric setup to enroll this device."
          : "Biometric sign-in was cancelled or is unavailable on this device.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const result =
        mode === "register"
          ? await register({ fullName, email, password, role })
          : await login({ email, password, role });

      if (result.requiresVerification) {
        setMode("verify_email");
        setError("");
        setSuccessMsg(
          result.message ||
            result.error ||
            "Please enter the 6-digit verification code sent to your email.",
        );
        return;
      }

      if (!result.ok || !result.user) {
        setError(result.error ?? "We couldn't sign you in.");
        return;
      }
      if ((mode === "register" || setUpBiometricAfterPassword) && biometricChoice !== "skip") {
        setPendingRole(result.user.role);
        setPendingBiometricSetup(true);
        setSuccessMsg(
          mode === "register"
            ? "Account created. Complete the selected biometric setup to finish."
            : "Signed in. Complete the selected biometric setup to enroll this device.",
        );
        return;
      }
      if (redirect) {
        window.location.assign(redirect);
        return;
      }
      navigate({ to: result.user.role === "employer" ? "/employer" : "/dashboard" });
    } catch (requestError) {
      setError(
        getRequestError(requestError, "We couldn't complete your request. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitVerification = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const res = await verifyEmailFn({
        data: {
          email: email.trim(),
          code: verificationCode.trim(),
        },
      });
      if (!res.ok) {
        setError(res.error ?? "Invalid or expired verification code.");
        return;
      }
      if (biometricChoice !== "skip") {
        setPendingRole(res.user?.role ?? role);
        setPendingBiometricSetup(true);
        setSuccessMsg("Email verified. Complete the selected biometric setup to finish.");
        return;
      }
      setSuccessMsg("Email verified successfully! Redirecting...");
      setTimeout(() => {
        if (redirect) {
          window.location.assign(redirect);
          return;
        }
        window.location.assign(res.user?.role === "employer" ? "/employer" : "/dashboard");
      }, 600);
    } catch {
      setError("Failed to verify email code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setError("Please enter your email address to receive a code.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const res = await requestVerificationFn({ data: { email: email.trim() } });
      if (res.ok) {
        setSuccessMsg(res.message || "A fresh 6-digit verification code has been sent.");
      }
    } catch {
      setError("Could not resend verification code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPasswordResetRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const res = await requestResetFn({ data: { email } });
      if (res.ok) {
        setResetSent(true);
        setSuccessMsg(res.message);
      }
    } catch {
      setError("Unable to process password reset request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPasswordResetConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const res = await confirmResetFn({
        data: {
          token: resetToken.trim(),
          newPassword,
        },
      });
      if (!res.ok || !res.user) {
        setError(res.error ?? "Could not reset password. Token may be invalid or expired.");
        return;
      }
      setSuccessMsg("Password reset successfully! Redirecting...");
      setTimeout(() => {
        window.location.assign(res.user.role === "employer" ? "/employer" : "/dashboard");
      }, 600);
    } catch {
      setError("Failed to confirm password reset. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)] sm:p-8">
        <h1 className="font-serif text-3xl text-foreground">
          {mode === "register"
            ? "Create your account"
            : mode === "forgot_password"
              ? "Reset your password"
              : mode === "verify_email"
                ? "Verify your email"
                : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "register"
            ? "Choose your portal and set up a secure account."
            : mode === "forgot_password"
              ? "Enter your account email to receive a password reset code."
              : mode === "verify_email"
                ? "Enter the 6-digit verification code sent to your email address."
                : "Choose the portal you need, then sign in with your credentials."}
        </p>

        {mode !== "forgot_password" && mode !== "verify_email" && (
          <div className="mt-6 grid grid-cols-2 gap-2" role="group" aria-label="Choose a portal">
            {(["candidate", "employer"] as const).map((item) => {
              const active = role === item;
              const Icon = item === "candidate" ? UserRound : Building2;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRole(item)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-foreground bg-[#7BD3C2] text-[#141817] font-semibold"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary"
                  }`}
                  aria-pressed={active}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item === "candidate" ? "User portal" : "Employer portal"}
                </button>
              );
            })}
          </div>
        )}

        {pendingBiometricSetup && (
          <section className="mt-6 space-y-4" aria-labelledby="biometric-setup-heading">
            <div className="rounded-xl border border-brand/30 bg-brand/10 p-4">
              <h2 id="biometric-setup-heading" className="flex items-center gap-2 font-semibold">
                {biometricChoice === "face" ? (
                  <Eye className="size-5" />
                ) : (
                  <Fingerprint className="size-5" />
                )}
                {isDirectEyeLogin ? "Sign in with eye check (demo)" : "Finish biometric setup"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {biometricChoice === "face"
                  ? "Complete the local camera eye check to sign in directly. No passkey prompt will open."
                  : "Select Continue to open your device’s fingerprint or screen-lock prompt."}
              </p>
              {biometricChoice === "face" && (
                <p className="mt-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                  Demo mode: this only checks that eyes are present in the camera frame; it does not
                  verify identity.
                </p>
              )}
            </div>

            {biometricChoice === "face" && (
              <div className="space-y-3">
                <video
                  ref={eyeVideoRef}
                  muted
                  playsInline
                  className={`aspect-video w-full rounded-xl bg-black object-cover ${eyeStreamRef.current ? "block" : "hidden"}`}
                  aria-label="Camera preview for eye check"
                />
                {!eyeCheckComplete && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={startEyeCheck}
                    disabled={isSubmitting}
                  >
                    <Eye className="mr-2 size-4" />
                    Open camera and verify eyes
                  </Button>
                )}
                {eyeCheckStatus && (
                  <p role="status" className="text-center text-sm text-muted-foreground">
                    {eyeCheckStatus}
                  </p>
                )}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="button"
              className="w-full"
              onClick={finishBiometricSetup}
              disabled={isSubmitting || (biometricChoice === "face" && !eyeCheckComplete)}
            >
              {isSubmitting
                ? biometricChoice === "face"
                  ? "Signing in…"
                  : "Opening secure prompt…"
                : biometricChoice === "face"
                  ? "Sign in directly with eye check"
                  : "Continue to device biometric prompt"}
            </Button>
            <button
              type="button"
              className="w-full text-sm font-medium text-muted-foreground underline hover:text-foreground"
              onClick={() => {
                stopEyeCamera();
                setPendingBiometricSetup(false);
                if (isDirectEyeLogin) {
                  setIsDirectEyeLogin(false);
                } else {
                  if (redirect) window.location.assign(redirect);
                  else navigate({ to: pendingRole === "employer" ? "/employer" : "/dashboard" });
                }
              }}
            >
              {isDirectEyeLogin ? "Back to sign in" : "Do this later"}
            </button>
          </section>
        )}

        {/* Regular Login & Register Forms */}
        {mode !== "forgot_password" && mode !== "verify_email" && !pendingBiometricSetup && (
          <form className="mt-6 space-y-4" onSubmit={submitAuth} noValidate>
            {mode === "register" && (
              <div>
                <label htmlFor="full-name" className="text-sm font-medium">
                  Full name
                </label>
                <Input
                  id="full-name"
                  className="mt-1.5"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <Input
                id="email"
                className="mt-1.5"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot_password");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                className="mt-1.5"
                type="password"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>

            {mode === "login" && !setUpBiometricAfterPassword && (
              <button
                type="button"
                onClick={() => setSetUpBiometricAfterPassword(true)}
                className="w-full text-left text-xs font-medium text-muted-foreground underline hover:text-foreground"
              >
                Set up face/eye or fingerprint sign-in after password sign-in
              </button>
            )}

            {(mode === "register" || setUpBiometricAfterPassword) && (
              <fieldset className="rounded-xl border border-border bg-secondary/20 p-3">
                <legend className="px-1 text-sm font-medium">Set up biometric sign-in</legend>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Choose how you prefer to unlock this account on this device. You can skip this and
                  add it later.
                </p>
                <div
                  className="mt-3 grid gap-2 sm:grid-cols-2"
                  role="radiogroup"
                  aria-label="Biometric sign-in preference"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={biometricChoice === "face"}
                    onClick={() => setBiometricChoice("face")}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      biometricChoice === "face"
                        ? "border-foreground bg-[#7BD3C2]/30 text-foreground"
                        : "border-border bg-background hover:bg-secondary"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Eye className="size-4" /> Face or eye unlock
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Use Face ID, Windows Hello, or your device camera when offered.
                    </span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={biometricChoice === "fingerprint"}
                    onClick={() => setBiometricChoice("fingerprint")}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      biometricChoice === "fingerprint"
                        ? "border-foreground bg-[#7BD3C2]/30 text-foreground"
                        : "border-border bg-background hover:bg-secondary"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Fingerprint className="size-4" /> Thumb or fingerprint
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Use your phone or computer’s fingerprint reader when offered.
                    </span>
                  </button>
                </div>
                <button
                  type="button"
                  role="radio"
                  aria-checked={biometricChoice === "skip"}
                  onClick={() => setBiometricChoice("skip")}
                  className="mt-2 text-xs font-medium text-muted-foreground underline hover:text-foreground"
                >
                  Skip biometric sign-in for now
                </button>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setSetUpBiometricAfterPassword(false)}
                    className="ml-4 text-xs font-medium text-muted-foreground underline hover:text-foreground"
                  >
                    Cancel setup
                  </button>
                )}
                <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                  For privacy and security, a normal camera cannot scan a fingerprint. Your device
                  verifies your face/eye or thumb locally; Ableo never receives the biometric data.
                </p>
              </fieldset>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait…"
                : mode === "register"
                  ? `Create ${role} account`
                  : `Sign in as ${role === "candidate" ? "user" : "employer"}`}
            </Button>
            {mode === "login" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting || !email.trim()}
                  onClick={startDirectEyeSignIn}
                >
                  <Eye className="mr-2 size-4" />
                  Sign in directly with camera eye check (demo)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-xs"
                  disabled={isSubmitting || !email.trim()}
                  onClick={signInWithBiometric}
                >
                  <Fingerprint className="mr-2 size-4" />
                  Sign in securely with a passkey
                </Button>
              </>
            )}
            {mode === "register" && (
              <p className="text-center text-xs text-muted-foreground">
                {biometricChoice === "face"
                  ? "Face/eye demo mode uses a local camera eye check and does not open a passkey prompt."
                  : "After account creation, your device will show its secure passkey prompt for the option you selected."}
              </p>
            )}
          </form>
        )}

        {/* Password Reset Workflow */}
        {mode === "forgot_password" && (
          <div className="mt-6 space-y-4">
            {!resetSent ? (
              <form onSubmit={submitPasswordResetRequest} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="text-sm font-medium">
                    Account Email
                  </label>
                  <Input
                    id="reset-email"
                    className="mt-1.5"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending reset link…" : "Send Reset Email"}
                </Button>
              </form>
            ) : (
              <form onSubmit={submitPasswordResetConfirm} className="space-y-4">
                {successMsg && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                      <p className="font-semibold">Check your email</p>
                      <p className="mt-0.5 text-xs leading-relaxed">{successMsg}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="reset-token" className="text-sm font-medium">
                    Reset Token / Code
                  </label>
                  <Input
                    id="reset-token"
                    className="mt-1.5 font-mono text-xs"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="64-character reset token"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </label>
                  <Input
                    id="new-password"
                    className="mt-1.5"
                    type="password"
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <KeyRound className="size-4 mr-2" />
                  {isSubmitting ? "Updating password…" : "Set New Password & Sign In"}
                </Button>
              </form>
            )}

            <button
              type="button"
              className="mt-4 w-full text-center text-sm font-medium text-muted-foreground underline hover:text-foreground"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccessMsg("");
                setResetSent(false);
              }}
            >
              Back to sign in
            </button>
          </div>
        )}

        {/* Email Verification Workflow */}
        {mode === "verify_email" && (
          <div className="mt-6 space-y-4">
            {successMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <p className="font-semibold">Verification Code Sent</p>
                  <p className="mt-0.5 text-xs leading-relaxed">{successMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={submitVerification} className="space-y-4">
              <div>
                <label htmlFor="verify-email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="verify-email"
                  className="mt-1.5"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="verify-code" className="text-sm font-medium">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={resendVerification}
                    disabled={isSubmitting}
                    className="text-xs text-brand hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <RotateCw className="size-3" />
                    Resend code
                  </button>
                </div>
                <Input
                  id="verify-code"
                  className="mt-1.5 text-center font-mono tracking-widest text-lg font-bold"
                  maxLength={6}
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  autoComplete="one-time-code"
                  required
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Check your inbox (or server console in development) for the 6-digit code.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <MailCheck className="size-4 mr-2" />
                {isSubmitting ? "Verifying code…" : "Verify Email & Sign In"}
              </Button>
            </form>

            <button
              type="button"
              className="mt-4 w-full text-center text-sm font-medium text-muted-foreground underline hover:text-foreground"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccessMsg("");
              }}
            >
              Back to sign in
            </button>
          </div>
        )}

        {/* Toggle between Register and Sign In */}
        {mode !== "forgot_password" && mode !== "verify_email" && (
          <button
            type="button"
            className="mt-5 w-full text-sm font-medium text-muted-foreground underline hover:text-foreground"
            onClick={() => {
              setMode(mode === "register" ? "login" : "register");
              setError("");
              setSuccessMsg("");
            }}
          >
            {mode === "register"
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        )}
      </div>
    </div>
  );
}
