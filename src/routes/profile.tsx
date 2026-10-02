import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { getUserProfile, saveUserProfile } from "@/lib/auth.functions";
import {
  FileText,
  Sparkles,
  Upload,
  CheckCircle2,
  Loader2,
  FileCheck,
  Eye,
  Hand,
  Ear,
  Brain,
  ShieldCheck,
  Database,
  Save,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppState, type Profile } from "@/lib/app-state";
import { ACCESS_PREFERENCE_OPTIONS, normalisePrefs } from "@/lib/accessibility";
import type { AccessFeature } from "@/lib/jobs-data";
import { parseResumeText, DEMO_RESUMES, type ParsedResume } from "@/lib/resume-parser";
import { extractResumeText } from "@/lib/resume-file";
import { AccessibleResumeExportModal } from "@/components/accessible-resume-export";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — Ableo" },
      {
        name: "description",
        content:
          "Create a professional job-seeker profile on Ableo. Upload a CV/PDF/image to automatically extract skills, experience, and accessibility needs.",
      },
      { property: "og:title", content: "Your Profile — Ableo" },
      {
        property: "og:description",
        content: "Build your career profile and get matched to accessibility-compatible roles.",
      },
    ],
  }),
  component: ProfilePage,
});

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ProfilePage() {
  const { profile, saveProfile, profileCompletion } = useAppState();
  const { user } = useAuth();
  const getUserProfileFn = useServerFn(getUserProfile);
  const saveUserProfileFn = useServerFn(saveUserProfile);

  const [form, setForm] = useState<Profile>(profile);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [storageSource, setStorageSource] = useState<"mongodb" | "sqlite" | "local">("local");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ParsedResume | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => setForm(profile), [profile]);

  // Auto-load profile from MongoDB Atlas on mount if user is logged in
  useEffect(() => {
    if (!user?.email) return;
    setIsLoadingRemote(true);
    getUserProfileFn({ data: { email: user.email } })
      .then((res) => {
        if (res.ok && res.profile) {
          const remote = res.profile as Record<string, unknown>;
          const merged: Profile = {
            ...profile,
            ...(remote as unknown as Partial<Profile>),
            email: user.email,
          };
          setForm(merged);
          saveProfile(merged);
          if (res.source) setStorageSource(res.source);
          setLastSaved(new Date().toLocaleTimeString());
          toast.success(
            res.source === "mongodb"
              ? "Profile loaded from MongoDB Atlas."
              : "Profile loaded from database.",
          );
        }
      })
      .catch((err) => {
        console.warn("Could not load database profile:", err);
      })
      .finally(() => {
        setIsLoadingRemote(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, getUserProfileFn]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const persistProfile = async (targetProfile: Profile) => {
    setIsSaving(true);
    try {
      saveProfile(targetProfile);
      const res = await saveUserProfileFn({
        data: {
          profile: targetProfile as unknown as Record<string, unknown>,
          email: user?.email || targetProfile.email,
        },
      });
      if (res.ok) {
        if (res.storage) setStorageSource(res.storage);
        setLastSaved(new Date().toLocaleTimeString());
        toast.success(
          res.storage === "mongodb"
            ? "Profile saved and synced to MongoDB Atlas!"
            : "Profile saved successfully to database.",
        );
      } else {
        toast.warning(res.error || "Profile saved locally.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Database notice: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const applyExtracted = (parsed: ParsedResume, sourceFileName?: string) => {
    const previous = form;
    const nextProfile = {
      ...previous,
      name: parsed.name || previous.name,
      displayName: parsed.name || previous.displayName,
      headline: parsed.headline || previous.headline,
      email: parsed.email || previous.email,
      skills: Array.from(new Set([...previous.skills, ...parsed.skills])),
      education: parsed.education || previous.education,
      experience: parsed.experience || previous.experience,
      experienceBand: parsed.experienceBand || previous.experienceBand,
      careerInterests: parsed.careerInterests || previous.careerInterests,
      certifications: parsed.certifications || previous.certifications,
      preferredLocation: parsed.preferredLocation || previous.preferredLocation,
      workPreference: parsed.workPreference || previous.workPreference,
      resumeName:
        sourceFileName ||
        (parsed.name ? `${parsed.name.replace(/\s+/g, "_")}_Resume.pdf` : previous.resumeName),
      resumeText: parsed.rawText || previous.resumeText,
      accessibilityPreferences: Array.from(
        new Set([...previous.accessibilityPreferences, ...parsed.suggestedAccommodations]),
      ),
    };
    setForm(nextProfile);
    void persistProfile(nextProfile);
  };

  const handleFileUpload = async (file: File) => {
    setIsScanning(true);
    try {
      const rawText = await extractResumeText(file);
      const parsed = parseResumeText(rawText, file.name);
      setExtractedData(parsed);
      applyExtracted(parsed, file.name);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not scan this resume.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="mt-1 text-muted-foreground">
            Ableo: Where Ability Meets Opportunity. Your profile matches you to inclusive jobs
            without barriers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold border-brand/50 text-brand hover:bg-brand/10"
            onClick={() => setExportOpen(true)}
          >
            <FileCheck className="size-3.5" />
            Export Accessible Resume
          </Button>
          {storageSource === "mongodb" ? (
            <Badge
              variant="outline"
              className="gap-1.5 py-1 px-3 border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
            >
              <Database className="size-3.5 text-emerald-600" />
              <span>MongoDB Atlas Synced</span>
            </Badge>
          ) : user ? (
            <Badge
              variant="outline"
              className="gap-1.5 py-1 px-3 border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
            >
              <Database className="size-3.5" />
              <span>Database Connected</span>
            </Badge>
          ) : null}
          <Badge
            variant="outline"
            className="gap-1.5 py-1 px-3 border-brand/40 bg-brand/5 text-brand"
          >
            <ShieldCheck className="size-4" />
            <span>Private by default</span>
          </Badge>
        </div>
      </div>

      <AccessibleResumeExportModal open={exportOpen} onOpenChange={setExportOpen} />

      {/* Completion Meter */}
      <div className="surface-card mt-6 p-4">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Profile completion</span>
          <span className="text-brand">{profileCompletion}%</span>
        </div>
        <Progress
          value={profileCompletion}
          className="mt-2"
          aria-label={`Profile ${profileCompletion} percent complete`}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          A complete profile unlocks 4-dimension job matching: Skills, Accessibility Needs, Work
          Preferences, and Gap Analysis.
        </p>
      </div>

      {/* FEATURE 2: Builds Your Profile from Your Resume (OCR & AI Extraction) */}
      <section
        aria-labelledby="resume-ai-heading"
        className="surface-card mt-6 border-brand/30 bg-brand-soft/40 p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 id="resume-ai-heading" className="text-lg font-bold">
                Auto-Build Profile from Resume (OCR &amp; AI)
              </h2>
              <p className="text-xs text-muted-foreground">
                Upload a CV (PDF, DOCX, TXT) to automatically extract your skills, education,
                experience, and accessibility needs.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* File Upload Trigger */}
          <div className="rounded-lg border-2 border-dashed border-border bg-background p-4 text-center transition-colors hover:border-brand">
            <Upload className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
            <label
              htmlFor="ocr-upload"
              className="mt-2 block cursor-pointer text-sm font-medium text-brand hover:underline"
            >
              {isScanning ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Scanning Resume…
                </span>
              ) : (
                "Upload Resume (PDF, DOCX, TXT)"
              )}
            </label>
            <input
              id="ocr-upload"
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="sr-only"
              disabled={isScanning}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Automatic skill &amp; accessibility extraction
            </p>
          </div>

          {/* Quick Demo Resumes */}
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileCheck className="size-4 text-success" />
              Test with Sample Accessible Resumes:
            </p>
            <div className="mt-2 space-y-1.5">
              {DEMO_RESUMES.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => {
                    setExtractedData(demo.parsed);
                    applyExtracted(demo.parsed);
                  }}
                  className="w-full text-left rounded-md border border-border/70 p-2 text-xs hover:bg-secondary/70 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold block">{demo.role}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {demo.disabilityFocus}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    Load
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Extracted preview card if available */}
        {extractedData ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-success font-semibold">
                <CheckCircle2 className="size-4" />
                <span>
                  Extracted: {extractedData.name} ({extractedData.confidence}% confidence)
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => applyExtracted(extractedData)}
              >
                Apply again
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {extractedData.skills.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
            {extractedData.suggestedAccommodations.length > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Inferred Accommodations: {extractedData.suggestedAccommodations.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <form
        className="mt-6 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          void persistProfile(form);
        }}
      >
        {/* Section 1: Basic details */}
        <section aria-labelledby="basics-heading" className="surface-card space-y-4 p-5">
          <h2 id="basics-heading" className="text-xl font-semibold">
            Basic details
          </h2>
          <Field label="Full name" id="name">
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field
            label="Display name"
            id="displayName"
            hint="The name employers see. Leave blank to use your full name."
          >
            <Input
              id="displayName"
              value={form.displayName}
              onChange={(e) => set("displayName", e.target.value)}
            />
          </Field>
          <Field
            label="Contact Email"
            id="email"
            hint="Shared with employers when you apply for a job."
          >
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field
            label="Pronouns (optional)"
            id="pronouns"
            hint="For example: she/her, he/him, they/them. Shared only if enabled in privacy."
          >
            <Input
              id="pronouns"
              value={form.pronouns}
              onChange={(e) => set("pronouns", e.target.value)}
            />
          </Field>
          <Field
            label="Professional headline"
            id="headline"
            hint="For example: Frontend Developer focused on accessible web interfaces"
          >
            <Input
              id="headline"
              value={form.headline}
              onChange={(e) => set("headline", e.target.value)}
            />
          </Field>
          <Field
            label="Skills"
            id="skills"
            hint="Separate skills with commas (e.g. React, Python, SQL, WCAG)"
          >
            <Input
              id="skills"
              value={form.skills.join(", ")}
              onChange={(e) =>
                set(
                  "skills",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
        </section>

        {/* Section 2: Career history */}
        <section aria-labelledby="career-heading" className="surface-card space-y-4 p-5">
          <h2 id="career-heading" className="text-xl font-semibold">
            Career history
          </h2>
          <Field label="Education" id="education">
            <Textarea
              id="education"
              rows={3}
              value={form.education}
              onChange={(e) => set("education", e.target.value)}
              placeholder="e.g. B.Tech in Computer Science, Xavier Institute of Engineering"
            />
          </Field>
          <Field label="Experience" id="experience">
            <Textarea
              id="experience"
              rows={4}
              value={form.experience}
              onChange={(e) => set("experience", e.target.value)}
              placeholder="Key roles, projects, responsibilities and achievements"
            />
          </Field>
          <Field label="Experience level" id="experienceBand" hint="Used for match scoring">
            <Select
              value={form.experienceBand}
              onValueChange={(v) => set("experienceBand", v as Profile["experienceBand"])}
            >
              <SelectTrigger id="experienceBand">
                <SelectValue placeholder="Select your experience level" />
              </SelectTrigger>
              <SelectContent>
                {["Fresher", "0-2 years", "2-5 years", "5+ years"].map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Career interests"
            id="careerInterests"
            hint="For example: frontend development, accessibility engineering, data analytics"
          >
            <Input
              id="careerInterests"
              value={form.careerInterests}
              onChange={(e) => set("careerInterests", e.target.value)}
            />
          </Field>
        </section>

        {/* Section 3: Job Preferences */}
        <section aria-labelledby="prefs-heading" className="surface-card space-y-4 p-5">
          <h2 id="prefs-heading" className="text-xl font-semibold">
            Work Preferences
          </h2>
          <Field
            label="Preferred location"
            id="preferredLocation"
            hint="City name (e.g. Mumbai, Bengaluru) or “Remote”"
          >
            <Input
              id="preferredLocation"
              value={form.preferredLocation}
              onChange={(e) => set("preferredLocation", e.target.value)}
            />
          </Field>
          <Field label="Work style preference" id="workPreference">
            <Select
              value={form.workPreference}
              onValueChange={(v) => set("workPreference", v as Profile["workPreference"])}
            >
              <SelectTrigger id="workPreference">
                <SelectValue placeholder="Select a work preference" />
              </SelectTrigger>
              <SelectContent>
                {["Remote", "Hybrid", "On-site", "No preference"].map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {form.resumeName ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 p-3 text-sm">
              <FileText className="size-4 text-brand" />
              <span>
                Attached Resume: <strong>{form.resumeName}</strong>
              </span>
            </div>
          ) : null}
        </section>

        {/* Section 4: My Disability & Access Needs */}
        <section aria-labelledby="access-heading" className="surface-card space-y-5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="access-heading" className="text-xl font-semibold flex items-center gap-2">
                <span>My Disability &amp; Access Needs</span>
                <Badge variant="outline" className="font-normal text-xs">
                  Optional &amp; Private
                </Badge>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ableo is built for People with Disabilities (PwD). Tell us your access needs and
                we'll match you to jobs that provide the right accommodations. We{" "}
                <strong>never</strong> calculate a "disability score", never use disability data
                against you, and everything here stays <strong>private by default</strong>.
              </p>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 border-success/40 bg-success/5 text-success gap-1"
            >
              <ShieldCheck className="size-3" />
              Consent-first
            </Badge>
          </div>

          {/* Voluntary Disability Self-Identification */}
          <fieldset className="rounded-lg border-2 border-brand/20 bg-brand-soft/30 p-4">
            <legend className="px-2 text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" />
              Voluntary Self-Identification (Optional)
            </legend>
            <p className="text-xs text-muted-foreground mb-3">
              This is entirely voluntary. Sharing your disability type helps us better filter jobs
              that match your accommodation needs. This is{" "}
              <strong>never shared with employers</strong> unless you explicitly choose to.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {[
                { key: "visual", label: "Blind / Low Vision", icon: "👁️" },
                { key: "deaf", label: "Deaf / Hard of Hearing", icon: "👂" },
                { key: "motor", label: "Motor / Physical Disability", icon: "♿" },
                { key: "cognitive", label: "Cognitive / Learning Disability", icon: "🧠" },
                { key: "neurodivergent", label: "Neurodivergent (ADHD, Autism, etc.)", icon: "🌈" },
                { key: "chronic", label: "Chronic Health Condition", icon: "💙" },
                { key: "mental_health", label: "Mental Health Condition", icon: "💚" },
                { key: "speech", label: "Speech / Communication", icon: "💬" },
                { key: "multiple", label: "Multiple Disabilities", icon: "🤝" },
                { key: "prefer_not", label: "Prefer not to say", icon: "🔒" },
              ].map((opt) => {
                const current = normalisePrefs(form.accessibilityPreferences);
                const selfIdKey = `self_${opt.key}` as unknown as AccessFeature;
                const checked = current.includes(selfIdKey);
                const id = `selfid-${opt.key}`;
                return (
                  <li key={opt.key} className="flex items-center gap-2.5">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() =>
                        set(
                          "accessibilityPreferences",
                          checked
                            ? form.accessibilityPreferences.filter((p) => p !== selfIdKey)
                            : [...form.accessibilityPreferences, selfIdKey],
                        )
                      }
                    />
                    <label
                      htmlFor={id}
                      className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{opt.icon}</span>
                      {opt.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          {/* Visual Accessibility — Expanded */}
          <fieldset className="rounded-lg border border-border p-3.5">
            <legend className="px-2 text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Eye className="size-3.5" />
              Visual Access Needs
            </legend>
            <p className="text-xs text-muted-foreground mb-2">
              For blind, low vision, and colour-blind users
            </p>
            <ul className="mt-1 grid gap-2.5 sm:grid-cols-2">
              {["screen_reader", "keyboard_friendly", "accessible_application"].map((key) => {
                const pref = ACCESS_PREFERENCE_OPTIONS.find((p) => p.key === key);
                if (!pref) return null;
                const id = `pref-${pref.key}`;
                const current = normalisePrefs(form.accessibilityPreferences);
                const checked = current.includes(pref.key);
                return (
                  <li key={pref.key} className="flex items-center gap-2.5">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() =>
                        set(
                          "accessibilityPreferences",
                          checked ? current.filter((p) => p !== pref.key) : [...current, pref.key],
                        )
                      }
                    />
                    <label htmlFor={id} className="text-sm font-medium cursor-pointer">
                      {pref.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          {/* Auditory & Communication Access — Expanded */}
          <fieldset className="rounded-lg border border-border p-3.5">
            <legend className="px-2 text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Ear className="size-3.5" />
              Auditory &amp; Communication Access
            </legend>
            <p className="text-xs text-muted-foreground mb-2">
              For Deaf, hard of hearing, and speech-disabled users
            </p>
            <ul className="mt-1 grid gap-2.5 sm:grid-cols-2">
              {["captioned_meetings", "assistive_tech"].map((key) => {
                const pref = ACCESS_PREFERENCE_OPTIONS.find((p) => p.key === key);
                if (!pref) return null;
                const id = `pref-${pref.key}`;
                const current = normalisePrefs(form.accessibilityPreferences);
                const checked = current.includes(pref.key);
                return (
                  <li key={pref.key} className="flex items-center gap-2.5">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() =>
                        set(
                          "accessibilityPreferences",
                          checked ? current.filter((p) => p !== pref.key) : [...current, pref.key],
                        )
                      }
                    />
                    <label htmlFor={id} className="text-sm font-medium cursor-pointer">
                      {pref.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          {/* Physical / Mobility Access — Expanded */}
          <fieldset className="rounded-lg border border-border p-3.5">
            <legend className="px-2 text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Hand className="size-3.5" />
              Physical &amp; Mobility Access
            </legend>
            <p className="text-xs text-muted-foreground mb-2">
              For wheelchair users, motor disabilities, and chronic pain conditions
            </p>
            <ul className="mt-1 grid gap-2.5 sm:grid-cols-2">
              {["remote_work", "flexible_work", "accessible_workplace", "accessible_interview"].map(
                (key) => {
                  const pref = ACCESS_PREFERENCE_OPTIONS.find((p) => p.key === key);
                  if (!pref) return null;
                  const id = `pref-${pref.key}`;
                  const current = normalisePrefs(form.accessibilityPreferences);
                  const checked = current.includes(pref.key);
                  return (
                    <li key={pref.key} className="flex items-center gap-2.5">
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={() =>
                          set(
                            "accessibilityPreferences",
                            checked
                              ? current.filter((p) => p !== pref.key)
                              : [...current, pref.key],
                          )
                        }
                      />
                      <label htmlFor={id} className="text-sm font-medium cursor-pointer">
                        {pref.label}
                      </label>
                    </li>
                  );
                },
              )}
            </ul>
          </fieldset>

          {/* Cognitive & Neurodivergent Access — NEW */}
          <fieldset className="rounded-lg border border-border p-3.5">
            <legend className="px-2 text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Brain className="size-3.5" />
              Cognitive &amp; Neurodivergent Access
            </legend>
            <p className="text-xs text-muted-foreground mb-2">
              For ADHD, autism, dyslexia, learning disabilities, and cognitive conditions
            </p>
            <ul className="mt-1 grid gap-2.5 sm:grid-cols-2">
              {[
                { key: "neuro_quiet_workspace", label: "Quiet / low-sensory workspace" },
                { key: "neuro_flexible_deadlines", label: "Flexible deadlines & pacing" },
                { key: "neuro_written_instructions", label: "Written (not verbal) instructions" },
                { key: "neuro_extended_time", label: "Extended time for assessments" },
                { key: "neuro_structured_tasks", label: "Structured task breakdowns" },
                { key: "neuro_focus_tools", label: "Focus & productivity tools allowed" },
              ].map((opt) => {
                const current = form.accessibilityPreferences;
                const checked = current.includes(opt.key);
                const id = `pref-${opt.key}`;
                return (
                  <li key={opt.key} className="flex items-center gap-2.5">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() =>
                        set(
                          "accessibilityPreferences",
                          checked ? current.filter((p) => p !== opt.key) : [...current, opt.key],
                        )
                      }
                    />
                    <label htmlFor={id} className="text-sm font-medium cursor-pointer">
                      {opt.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          {/* Chronic Health & Mental Health — NEW */}
          <fieldset className="rounded-lg border border-border p-3.5">
            <legend className="px-2 text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
              <span className="text-sm">💙</span>
              Chronic Health &amp; Mental Health
            </legend>
            <p className="text-xs text-muted-foreground mb-2">
              For chronic illness, energy-limiting conditions, and mental health needs
            </p>
            <ul className="mt-1 grid gap-2.5 sm:grid-cols-2">
              {[
                { key: "health_flexible_hours", label: "Flexible / reduced hours" },
                { key: "health_medical_leave", label: "Medical leave & appointment flexibility" },
                { key: "health_rest_breaks", label: "Frequent rest breaks" },
                { key: "health_wfh_flares", label: "Work from home during flare-ups" },
                { key: "health_wellness_support", label: "Employer wellness / EAP support" },
                { key: "health_ergonomic", label: "Ergonomic workspace setup" },
              ].map((opt) => {
                const current = form.accessibilityPreferences;
                const checked = current.includes(opt.key);
                const id = `pref-${opt.key}`;
                return (
                  <li key={opt.key} className="flex items-center gap-2.5">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() =>
                        set(
                          "accessibilityPreferences",
                          checked ? current.filter((p) => p !== opt.key) : [...current, opt.key],
                        )
                      }
                    />
                    <label htmlFor={id} className="text-sm font-medium cursor-pointer">
                      {opt.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          {/* Custom Accommodation Note */}
          <div className="rounded-lg border border-border p-3.5">
            <label htmlFor="custom-accommodation" className="text-sm font-semibold block mb-1">
              Additional accommodation needs (free text)
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Describe any specific accommodations not listed above. This is never shared without
              your permission.
            </p>
            <Textarea
              id="custom-accommodation"
              rows={3}
              placeholder="e.g. I need a sign language interpreter for meetings, or I require specific lighting conditions..."
              value={
                form.accessibilityPreferences
                  .find((p) => p.startsWith("custom:"))
                  ?.replace("custom:", "") || ""
              }
              onChange={(e) => {
                const filtered = form.accessibilityPreferences.filter(
                  (p) => !p.startsWith("custom:"),
                );
                const val = e.target.value.trim();
                set("accessibilityPreferences", val ? [...filtered, `custom:${val}`] : filtered);
              }}
            />
          </div>

          {/* Privacy Controls */}
          <div className="rounded-lg border-2 border-brand/20 bg-brand-soft/20 p-4 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="size-4 text-brand" />
              Disability Information Privacy
            </h3>
            <p className="text-xs text-muted-foreground">
              Your disability and accommodation information is{" "}
              <strong>always private by default</strong>. You have full control over what is shared
              and when. Ableo will never infer, assume, or disclose your disability status.
            </p>
            <div className="flex items-start gap-3">
              <Switch
                id="share-access"
                checked={form.shareAccessibilityWithEmployers}
                onCheckedChange={(v) => set("shareAccessibilityWithEmployers", v)}
              />
              <div>
                <label htmlFor="share-access" className="text-sm font-semibold cursor-pointer">
                  Share accommodation needs with employers when I apply
                </label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  When ON, employers see which workplace accommodations you need (not your
                  disability type). You can override this per application.{" "}
                  <strong>Default: OFF</strong>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Switch
                id="share-accommodations-default"
                checked={form.shareAccommodationsByDefault}
                onCheckedChange={(v) => set("shareAccommodationsByDefault", v)}
              />
              <div>
                <label
                  htmlFor="share-accommodations-default"
                  className="text-sm font-semibold cursor-pointer"
                >
                  Pre-fill accommodation requests in applications
                </label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Auto-populates your accommodation needs in every application form so you don't
                  have to re-type them. <strong>Default: OFF</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" size="lg" className="min-w-44 gap-2" disabled={isSaving}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span>{isSaving ? "Saving to MongoDB…" : "Save Profile to Database"}</span>
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={isLoadingRemote}
            onClick={() => {
              if (user?.email) {
                setIsLoadingRemote(true);
                getUserProfileFn({ data: { email: user.email } })
                  .then((res) => {
                    if (res.ok && res.profile) {
                      const remote = res.profile as Record<string, unknown>;
                      setForm((prev) => ({
                        ...prev,
                        ...(remote as unknown as Partial<Profile>),
                      }));
                      toast.success("Profile reloaded from database.");
                    } else {
                      setForm(profile);
                    }
                  })
                  .finally(() => setIsLoadingRemote(false));
              } else {
                setForm(profile);
                toast.info("Form reset to saved state.");
              }
            }}
            className="gap-2"
          >
            {isLoadingRemote ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            <span>{isLoadingRemote ? "Reloading…" : "Reset / Reload"}</span>
          </Button>
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 sm:ml-auto">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Saved to database at {lastSaved}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
