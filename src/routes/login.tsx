import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [role, setRole] = useState<"candidate" | "employer">("candidate");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("alex.morgan@inclusive-work.dev");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleQuickDemoLogin = async (demoRole: "candidate" | "employer") => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const demoEmail =
      demoRole === "candidate"
        ? "alex.morgan@inclusive-work.dev"
        : "recruiter@inclusive-work.dev";

    try {
      const result = await login({
        email: demoEmail,
        password: "password123",
        role: demoRole,
      });

      if (!result.ok) {
        setErrorMessage(result.error || "Unable to sign in to demo account.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        `Signed in as ${demoRole === "candidate" ? "Alex Morgan" : "Inclusive Recruiter"}!`
      );
      setTimeout(() => {
        navigate({ to: demoRole === "employer" ? "/employer" : "/dashboard" });
      }, 350);
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred during sign in.");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === "register") {
        const result = await register({
          fullName: fullName.trim() || email.split("@")[0] || "Ableo User",
          email: email.trim().toLowerCase(),
          password: password.trim() || "password123",
          role,
        });

        if (!result.ok) {
          setErrorMessage(result.error || "Failed to create account. Please try again.");
          setIsLoading(false);
          return;
        }

        setSuccessMessage("Account created successfully!");
        setTimeout(() => {
          navigate({ to: role === "employer" ? "/employer" : "/dashboard" });
        }, 400);
      } else {
        const result = await login({
          email: email.trim().toLowerCase(),
          password: password.trim() || "password123",
          role,
        });

        if (!result.ok) {
          setErrorMessage(result.error || "Invalid credentials. Please verify and try again.");
          setIsLoading(false);
          return;
        }

        setSuccessMessage("Signed in successfully!");
        setTimeout(() => {
          navigate({ to: role === "employer" ? "/employer" : "/dashboard" });
        }, 350);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Authentication service is temporarily unavailable.");
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 space-y-6">
      {/* 1-Click Instant Demo Access Box */}
      <div className="surface-card rounded-2xl border border-brand/40 bg-brand-soft/30 p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand">
          <Sparkles className="size-4" />
          <span>One-Click Instant Demo Portals</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Explore Ableo immediately with pre-configured accessible profiles:
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            disabled={isLoading}
            onClick={() => handleQuickDemoLogin("candidate")}
            className="text-xs gap-1.5 h-9 bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
            <User className="size-3.5" />
            <span>Job Seeker</span>
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isLoading}
            onClick={() => handleQuickDemoLogin("employer")}
            className="text-xs gap-1.5 h-9 bg-[#7BD3C2] text-[#141817] hover:bg-[#68c5b3] font-semibold"
          >
            <Building2 className="size-3.5" />
            <span>Employer Portal</span>
          </Button>
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="surface-card">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-brand/20 text-brand">
            <Lock className="size-5" />
          </div>
          <CardTitle className="font-display text-2xl font-bold">
            {mode === "signin" ? "Sign In to Ableo" : "Create Your Ableo Account"}
          </CardTitle>
          <CardDescription className="text-xs">
            {mode === "signin"
              ? "Access your disability-first career dashboard"
              : "Join India's inclusive employment network"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mode Switch (Sign In vs Register) */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-secondary/60 rounded-xl text-xs font-medium border border-border/50">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMessage(null);
              }}
              className={`py-1.5 rounded-lg transition-all text-center ${
                mode === "signin"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
              }}
              className={`py-1.5 rounded-lg transition-all text-center ${
                mode === "register"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs"
            >
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Account Role</Label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-xl">
                <Button
                  type="button"
                  variant={role === "candidate" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setRole("candidate");
                    if (email === "recruiter@inclusive-work.dev") {
                      setEmail("alex.morgan@inclusive-work.dev");
                    }
                  }}
                  className="text-xs gap-1.5 h-8"
                >
                  <User className="size-3.5" />
                  Job Seeker
                </Button>
                <Button
                  type="button"
                  variant={role === "employer" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setRole("employer");
                    if (email === "alex.morgan@inclusive-work.dev") {
                      setEmail("recruiter@inclusive-work.dev");
                    }
                  }}
                  className="text-xs gap-1.5 h-8"
                >
                  <Building2 className="size-3.5" />
                  Employer
                </Button>
              </div>
            </div>

            {/* Full Name (Registration only) */}
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold">
                  Full Name / Display Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-xs sm:text-sm h-10"
                />
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs sm:text-sm h-10"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password
                </Label>
                {mode === "signin" && (
                  <span className="text-[11px] text-muted-foreground">
                    Demo default: password123
                  </span>
                )}
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-xs sm:text-sm h-10"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#7BD3C2] text-[#141817] hover:bg-[#68c5b3] font-semibold text-xs sm:text-sm h-10 gap-1.5 shadow-xs"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : mode === "signin" ? (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="size-4" />
                </>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  <span>Create Account</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
