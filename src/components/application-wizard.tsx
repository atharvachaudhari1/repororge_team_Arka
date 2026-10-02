import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CheckCircle2,
  ClipboardCopy,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Mic,
  Pencil,
  Square,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Job } from "@/lib/jobs-data";
import { useAppState, type Profile } from "@/lib/app-state";
import { generateAccommodationRequest } from "@/lib/ai.functions";
import { useTextToSpeech, useVoiceSearch } from "@/lib/speech";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEPS = [
  "Personal Information",
  "Resume",
  "Accessibility & Accommodation",
  "Identity & Name Preferences",
  "Application Questions",
  "Review & Submit",
] as const;

export const ACCOMMODATIONS = [
  "Accessible interview",
  "Screen-reader-compatible assessment",
  "Captioned interview",
  "Additional assessment time",
  "Remote interview",
  "Flexible scheduling",
  "Physical accessibility",
  "Other",
];

/** Deterministic template used when AI is unavailable — never fabricated AI output. */
export function fallbackAccommodationRequest(selections: string[], roleTitle: string) {
  if (!selections.length) return "";
  const list =
    selections.length === 1
      ? selections[0]!
      : `${selections.slice(0, -1).join(", ")} and ${selections[selections.length - 1]!}`;
  return `I would appreciate ${list.toLowerCase()} during the hiring process for the ${roleTitle} role. Please let me know if alternative arrangements are available.`;
}

type WizardData = {
  fullName: string;
  preferredName: string;
  email: string;
  headline: string;
  resumeName: string;
  resumeText: string;
  accommodations: string[];
  accNote: string;
  requestText: string;
  shareRequests: boolean;
  pronouns: string;
  legalName: string;
  shareDisplayName: boolean;
  shareLegalName: boolean;
  sharePronouns: boolean;
  q1: string;
  extraNote: string;
};

function initFromProfile(p: Profile): WizardData {
  return {
    fullName: p.name,
    preferredName: p.displayName,
    email: p.email,
    headline: p.headline,
    resumeName: p.resumeName,
    resumeText: p.resumeText,
    accommodations: [],
    accNote: "",
    requestText: "",
    shareRequests: p.shareAccessibilityWithEmployers || p.shareAccommodationsByDefault,
    pronouns: p.pronouns,
    legalName: p.legalName,
    shareDisplayName: p.shareDisplayName,
    shareLegalName: p.shareLegalName,
    sharePronouns: p.sharePronouns,
    q1: "",
    extraNote: "",
  };
}

/* ------------------------------------------------------------------ */
/*  Information-sharing preview (Feature 2)                            */
/* ------------------------------------------------------------------ */

function SharingPreview({ data }: { data: WizardData }) {
  const optional: string[] = [];
  if (data.pronouns.trim()) optional.push(`Pronouns (${data.pronouns.trim()})`);
  if (data.preferredName.trim()) optional.push(`Preferred name: ${data.preferredName.trim()}`);
  if (data.accommodations.length)
    optional.push(
      `Accommodation request${data.shareRequests ? "" : " (kept private — sharing is off)"}`,
    );

  return (
    <section aria-labelledby="sharing-heading" className="surface-card p-5">
      <h3 id="sharing-heading" className="text-lg font-semibold">
        Who will receive your information?
      </h3>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-border p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <Eye aria-hidden="true" className="size-4 text-brand" />
            Shared with employer
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>{data.fullName || "Name not added yet"}</li>
            <li>{data.email || "Email not added yet"}</li>
            <li>Resume{data.resumeName ? ` (${data.resumeName})` : ""}</li>
            <li>Skills</li>
            <li>Experience</li>
          </ul>
        </div>
        <div className="rounded-md border border-border p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <Pencil aria-hidden="true" className="size-4 text-highlight" />
            Optional — your choice
          </h4>
          {optional.length ? (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {optional.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Nothing selected.</p>
          )}
        </div>
        <div className="rounded-md border border-border p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <Lock aria-hidden="true" className="size-4 text-success" />
            Private by default
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Gender identity — never collected</li>
            <li>Disability identity — never collected</li>
            <li>Other sensitive information</li>
            {!data.shareLegalName && data.legalName.trim() ? (
              <li>Legal name — private until you choose</li>
            ) : null}
          </ul>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Sharing an accommodation request is always voluntary and never affects your match score.
        Disclosure is never presented as improving your chances.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Wizard                                                             */
/* ------------------------------------------------------------------ */

export function ApplicationWizard({ job }: { job: Job }) {
  const { profile, saveProfile, apply } = useWizardDeps();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(() => initFromProfile(profile));
  const [announcement, setAnnouncement] = useState("");
  const [submitted, setSubmitted] = useState<null | { date: string; sharedRequests: boolean }>(
    null,
  );
  const tts = useTextToSpeech();

  const set = <K extends keyof WizardData>(key: K, value: WizardData[K]) =>
    setData((p) => ({ ...p, [key]: value }));

  /* ---- Accommodation request assistant (Feature 5) ---- */
  const genRequest = useServerFn(generateAccommodationRequest);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSource, setRequestSource] = useState<"ai" | "template" | null>(null);

  const generateRequest = async () => {
    if (!data.accommodations.length) return;
    setRequestLoading(true);
    try {
      const res = await genRequest({
        data: {
          roleTitle: job.title,
          selections: data.accommodations,
          note: data.accNote,
        },
      });
      if (res.ok) {
        set("requestText", res.request);
        setRequestSource("ai");
      } else {
        set("requestText", fallbackAccommodationRequest(data.accommodations, job.title));
        setRequestSource("template");
      }
    } catch {
      set("requestText", fallbackAccommodationRequest(data.accommodations, job.title));
      setRequestSource("template");
    } finally {
      setRequestLoading(false);
    }
  };

  /* ---- Voice assistance (Feature 6) ---- */
  type VoiceTarget = "q1" | "extraNote" | "accNote";
  const [voiceTarget, setVoiceTarget] = useState<VoiceTarget | null>(null);
  const voice = useVoiceSearch((text) => {
    if (!voiceTarget) return;
    setData((p) => {
      const existing = p[voiceTarget];
      return { ...p, [voiceTarget]: existing ? `${existing} ${text}` : text };
    });
    setAnnouncement(`Voice captured for review: ${text}`);
  });

  const question = useMemo(
    () =>
      `Why are you interested in the ${job.title} role at ${job.company}, and what makes you a strong fit?`,
    [job.title, job.company],
  );

  const canContinue = step !== 0 || (data.fullName.trim() !== "" && data.email.trim() !== "");

  const goToStep = (next: number) => {
    setStep(next);
    setAnnouncement(`Step ${next + 1} of ${STEPS.length}: ${STEPS[next]}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = () => {
    // Persist identity preferences back to the profile.
    saveProfile({
      ...profile,
      name: data.fullName.trim(),
      displayName: data.preferredName.trim(),
      email: data.email.trim(),
      headline: data.headline.trim(),
      resumeName: data.resumeName.trim(),
      resumeText: data.resumeText,
      pronouns: data.pronouns.trim(),
      legalName: data.legalName.trim(),
      shareDisplayName: data.shareDisplayName,
      shareLegalName: data.shareLegalName,
      sharePronouns: data.sharePronouns,
    });
    const coverLetter = [data.q1.trim(), data.extraNote.trim()].filter(Boolean).join("\n\n");
    apply({
      jobId: job.id,
      resumeName: data.resumeName.trim() || "No resume attached",
      coverLetter,
      accommodations: data.accommodations,
      accommodationNote:
        data.requestText.trim() ||
        (data.accNote.trim()
          ? data.accNote
          : fallbackAccommodationRequest(data.accommodations, job.title)),
      shareAccommodations: data.shareRequests,
      matchScore: 0,
      nextStep: "Application received — this demo tracker simulates employer updates.",
    });

    // Also persist to server database if candidate has an active session
    void (async () => {
      try {
        const { applyToJob } = await import("@/lib/jobs.functions");
        await applyToJob({
          data: {
            jobId: job.id,
            resumeName: data.resumeName.trim() || "No resume attached",
            resumeText: data.resumeText || "",
            coverLetter,
            accommodations: data.accommodations,
            shareAccommodations: data.shareRequests,
            matchScore: 0,
          },
        });
      } catch {
        // Continue smoothly if unauthenticated or offline
      }
    })();
    tts.stop();
    voice.stop();
    setSubmitted({
      date: new Date().toISOString().slice(0, 10),
      sharedRequests: data.shareRequests,
    });
    setAnnouncement("Application submitted.");
    toast.success("Application submitted");
  };

  /* ---------------- Confirmation screen (Feature 8) ---------------- */
  if (submitted) {
    return (
      <div className="space-y-6">
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
        <section
          aria-labelledby="submitted-heading"
          className="surface-card border-brand/30 bg-brand-soft p-6"
        >
          <h2 id="submitted-heading" className="flex items-center gap-2 text-2xl font-bold">
            <CheckCircle2 aria-hidden="true" className="size-6 text-success" />
            Application submitted
          </h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-background p-3">
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="mt-1 inline-flex items-center rounded-full bg-brand/15 px-2.5 py-1 text-sm font-semibold text-brand">
                Submitted
              </dd>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <dt className="text-xs text-muted-foreground">Date applied</dt>
              <dd className="mt-1 font-semibold">{submitted.date}</dd>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <dt className="text-xs text-muted-foreground">Job</dt>
              <dd className="mt-1 font-semibold">{job.title}</dd>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <dt className="text-xs text-muted-foreground">Employer</dt>
              <dd className="mt-1 font-semibold">{job.company}</dd>
            </div>
            <div className="rounded-md border border-border bg-background p-3 sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Accessibility request status</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-semibold">
                {submitted.sharedRequests ? (
                  <>
                    <Eye aria-hidden="true" className="size-4 text-brand" />
                    Shared with employer
                  </>
                ) : (
                  <>
                    <Lock aria-hidden="true" className="size-4 text-success" />
                    Kept private on AccessPath
                  </>
                )}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Demo application — statuses shown in your tracker (Under Review, Interview, Decision)
            are simulated and are not real employer updates.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild className="min-h-11">
              <Link to="/applications">Track application</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
                Back to job
              </Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* Progress */}
      <nav aria-label="Application steps" className="surface-card p-4">
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
          {STEPS.map((title, i) => (
            <li key={title} className="flex items-center gap-1">
              {i > 0 && (
                <span aria-hidden="true" className="px-0.5 text-muted-foreground">
                  →
                </span>
              )}
              <span
                aria-current={i === step ? "step" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                  i === step
                    ? "bg-brand text-brand-foreground font-semibold"
                    : i < step
                      ? "bg-brand/10 text-brand"
                      : "bg-secondary text-secondary-foreground"
                }`}
              >
                {i < step ? <CheckCircle2 aria-hidden="true" className="size-3.5" /> : null}
                <span className="sr-only">Step {i + 1}: </span>
                {title}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-sm font-medium">
          Step {step + 1} of {STEPS.length}
        </p>
      </nav>

      {/* STEP 1 — Personal information */}
      {step === 0 && (
        <section aria-labelledby="s1-heading" className="surface-card space-y-4 p-5">
          <h2 id="s1-heading" className="text-xl font-semibold">
            Personal Information
          </h2>
          <p className="text-sm text-muted-foreground">
            Prefilled from your profile. Edit anything before continuing.
          </p>
          <div>
            <label htmlFor="w-name" className="block text-sm font-medium">
              Full name *
            </label>
            <Input
              id="w-name"
              className="mt-1.5 min-h-11"
              required
              value={data.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="w-email" className="block text-sm font-medium">
              Email *
            </label>
            <Input
              id="w-email"
              type="email"
              className="mt-1.5 min-h-11"
              required
              value={data.email}
              onChange={(e) => set("email", e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="w-headline" className="block text-sm font-medium">
              Professional headline
            </label>
            <Input
              id="w-headline"
              className="mt-1.5 min-h-11"
              value={data.headline}
              onChange={(e) => set("headline", e.target.value)}
            />
          </div>
        </section>
      )}

      {/* STEP 2 — Resume */}
      {step === 1 && (
        <section aria-labelledby="s2-heading" className="surface-card space-y-4 p-5">
          <h2 id="s2-heading" className="text-xl font-semibold">
            Resume
          </h2>
          <div>
            <label htmlFor="w-resume-name" className="block text-sm font-medium">
              Resume file name
            </label>
            <Input
              id="w-resume-name"
              className="mt-1.5 min-h-11"
              value={data.resumeName}
              onChange={(e) => set("resumeName", e.target.value)}
              placeholder="my-resume.pdf"
            />
          </div>
          <div>
            <label htmlFor="w-resume-text" className="block text-sm font-medium">
              Resume text (optional)
            </label>
            <Textarea
              id="w-resume-text"
              rows={8}
              className="mt-1.5"
              value={data.resumeText}
              onChange={(e) => set("resumeText", e.target.value)}
              placeholder="Paste your resume text…"
            />
          </div>
        </section>
      )}

      {/* STEP 3 — Accessibility & Accommodation (Features 4 + 5) */}
      {step === 2 && (
        <section aria-labelledby="s3-heading" className="surface-card space-y-4 p-5">
          <h2 id="s3-heading" className="text-xl font-semibold">
            Would you like to request an accommodation?
          </h2>
          <p className="text-sm text-muted-foreground">
            Entirely optional. Your selection does not disclose your disability automatically.
          </p>
          <fieldset>
            <legend className="text-sm font-medium">Select any that apply</legend>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {ACCOMMODATIONS.map((a) => {
                const id = `acc-w-${a.replace(/\W+/g, "-").toLowerCase()}`;
                const checked = data.accommodations.includes(a);
                return (
                  <li key={a} className="flex items-center gap-2">
                    <Checkbox
                      id={id}
                      checked={checked}
                      className="size-5"
                      onCheckedChange={() =>
                        set(
                          "accommodations",
                          checked
                            ? data.accommodations.filter((x) => x !== a)
                            : [...data.accommodations, a],
                        )
                      }
                    />
                    <label htmlFor={id} className="text-sm">
                      {a}
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
          <div>
            <label htmlFor="w-acc-note" className="block text-sm font-medium">
              Anything else to add? (optional)
            </label>
            <Textarea
              id="w-acc-note"
              rows={2}
              className="mt-1.5"
              value={data.accNote}
              onChange={(e) => set("accNote", e.target.value)}
            />
          </div>

          <div className="rounded-md border border-border bg-secondary/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Your request</h3>
              <Button
                onClick={generateRequest}
                disabled={!data.accommodations.length || requestLoading}
                size="sm"
                className="min-h-11"
              >
                {requestLoading ? (
                  <>
                    <Loader2 aria-hidden="true" className="animate-spin" /> Drafting…
                  </>
                ) : (
                  <>Generate Request</>
                )}
              </Button>
            </div>
            {!data.requestText ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Select accommodations and generate a professional request draft. Only your selected
                options are used — nothing medical is inferred.
              </p>
            ) : (
              <>
                <label htmlFor="w-request" className="sr-only">
                  Accommodation request text (editable)
                </label>
                <Textarea
                  id="w-request"
                  rows={4}
                  className="mt-2"
                  value={data.requestText}
                  onChange={(e) => {
                    set("requestText", e.target.value);
                    setRequestSource(null);
                  }}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    aria-label="Copy request text"
                    onClick={() =>
                      navigator.clipboard
                        .writeText(data.requestText)
                        .then(() => toast.success("Request copied"))
                        .catch(() => toast.error("Copy failed — select the text manually."))
                    }
                  >
                    <ClipboardCopy aria-hidden="true" /> Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    aria-label="Edit request text"
                    onClick={() => document.getElementById("w-request")?.focus()}
                  >
                    <Pencil aria-hidden="true" /> Edit
                  </Button>
                  {tts.supported && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      aria-label="Listen to request text"
                      onClick={() =>
                        tts.state === "idle" ? tts.play(data.requestText) : tts.stop()
                      }
                    >
                      {tts.state === "idle" ? (
                        <>
                          <Volume2 aria-hidden="true" /> Listen
                        </>
                      ) : (
                        <>
                          <Square aria-hidden="true" /> Stop
                        </>
                      )}
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {requestSource === "ai"
                      ? "Drafted by AI from your selected options only."
                      : requestSource === "template"
                        ? "Standard template built from your selected options."
                        : "Edited by you."}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-md border border-border bg-secondary/50 p-3">
            <Switch
              id="w-share-req"
              checked={data.shareRequests}
              onCheckedChange={(v) => set("shareRequests", v)}
            />
            <label htmlFor="w-share-req" className="text-sm">
              Share this request with the employer
              <span className="block text-muted-foreground">
                Off by default. If off, it stays private on AccessPath.
              </span>
            </label>
          </div>
        </section>
      )}

      {/* STEP 4 — Identity & Name Preferences (Feature 3) */}
      {step === 3 && (
        <section aria-labelledby="s4-heading" className="surface-card space-y-4 p-5">
          <h2 id="s4-heading" className="text-xl font-semibold">
            Identity &amp; Name Preferences
          </h2>
          <div>
            <label htmlFor="w-prefname" className="block text-sm font-medium">
              Preferred name
            </label>
            <Input
              id="w-prefname"
              className="mt-1.5 min-h-11"
              value={data.preferredName}
              onChange={(e) => set("preferredName", e.target.value)}
              placeholder="e.g. Ananya"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Your preferred name will be used in the candidate-facing application where supported.
            </p>
          </div>
          <div>
            <label htmlFor="w-legalname" className="block text-sm font-medium">
              Legal name (optional)
            </label>
            <Input
              id="w-legalname"
              className="mt-1.5 min-h-11"
              value={data.legalName}
              onChange={(e) => set("legalName", e.target.value)}
              placeholder="Private until required"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              AccessPath keeps this private until you choose to share it — typically only needed
              after an offer for payroll or background checks.
            </p>
          </div>
          <div>
            <label htmlFor="w-pronouns" className="block text-sm font-medium">
              Pronouns (optional)
            </label>
            <Input
              id="w-pronouns"
              className="mt-1.5 min-h-11"
              value={data.pronouns}
              onChange={(e) => set("pronouns", e.target.value)}
              placeholder="e.g. she/her"
            />
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">What the employer sees</legend>
            {(
              [
                [
                  "w-share-display",
                  data.shareDisplayName,
                  (v: boolean) => set("shareDisplayName", v),
                  "Share preferred name",
                  "AccessPath-controlled: shown on your application where supported.",
                ],
                [
                  "w-share-pronouns",
                  data.sharePronouns,
                  (v: boolean) => set("sharePronouns", v),
                  "Share pronouns",
                  "AccessPath-controlled: off by default.",
                ],
                [
                  "w-share-legal",
                  data.shareLegalName,
                  (v: boolean) => set("shareLegalName", v),
                  "Share legal name",
                  "AccessPath-controlled: off by default until required.",
                ],
              ] as const
            ).map(([id, value, setter, label, help]) => (
              <div
                key={id}
                className="flex items-start gap-3 rounded-md border border-border bg-secondary/50 p-3"
              >
                <Switch id={id} checked={value} onCheckedChange={setter} />
                <label htmlFor={id} className="text-sm">
                  {label}
                  <span className="block text-muted-foreground">{help}</span>
                </label>
              </div>
            ))}
          </fieldset>

          <p className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
            AccessPath controls how your names appear inside this application. External employers
            control their own systems, so we cannot guarantee they will honour these preferences
            automatically — you can raise it directly with them at any stage.
          </p>
        </section>
      )}

      {/* STEP 5 — Application Questions (Feature 6) */}
      {step === 4 && (
        <section aria-labelledby="s5-heading" className="surface-card space-y-5 p-5">
          <h2 id="s5-heading" className="text-xl font-semibold">
            Application Questions
          </h2>

          <div className="rounded-md border border-border bg-secondary/50 p-4">
            <h3 className="text-base font-semibold">{question}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {tts.supported && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={() => (tts.state === "idle" ? tts.play(question) : tts.stop())}
                >
                  {tts.state === "idle" ? (
                    <>
                      <Volume2 aria-hidden="true" /> Read Question
                    </>
                  ) : (
                    <>
                      <Square aria-hidden="true" /> Stop reading
                    </>
                  )}
                </Button>
              )}
              {voice.supported && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  aria-pressed={voice.listening && voiceTarget === "q1"}
                  aria-label={
                    voice.listening && voiceTarget === "q1" ? "Stop voice input" : "Answer by voice"
                  }
                  onClick={() => {
                    if (voice.listening && voiceTarget === "q1") {
                      voice.stop();
                      return;
                    }
                    setVoiceTarget("q1");
                    voice.start();
                  }}
                >
                  <Mic aria-hidden="true" />
                  {voice.listening && voiceTarget === "q1" ? "Stop recording" : "Answer by Voice"}
                </Button>
              )}
            </div>
            <label htmlFor="w-q1" className="mt-3 block text-sm font-medium">
              Your answer (review before submitting)
            </label>
            <Textarea
              id="w-q1"
              rows={6}
              className="mt-1.5"
              value={data.q1}
              onChange={(e) => set("q1", e.target.value)}
              placeholder="Type or dictate your answer. Nothing is submitted automatically — you confirm on the next step."
            />
          </div>

          <div>
            <label htmlFor="w-extra" className="block text-sm font-medium">
              Anything else you want the employer to know (optional)
            </label>
            <Textarea
              id="w-extra"
              rows={3}
              className="mt-1.5"
              value={data.extraNote}
              onChange={(e) => set("extraNote", e.target.value)}
            />
            {voice.supported && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 min-h-11"
                aria-pressed={voice.listening && voiceTarget === "extraNote"}
                onClick={() => {
                  if (voice.listening && voiceTarget === "extraNote") {
                    voice.stop();
                    return;
                  }
                  setVoiceTarget("extraNote");
                  voice.start();
                }}
              >
                <Mic aria-hidden="true" />
                {voice.listening && voiceTarget === "extraNote"
                  ? "Stop recording"
                  : "Answer by Voice"}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Voice transcriptions appear above for your review. You must press Submit on the final
            step — nothing is ever submitted automatically.
          </p>
        </section>
      )}

      {/* STEP 6 — Review & Submit (Features 2 + 7) */}
      {step === 5 && (
        <div className="space-y-6">
          <section aria-labelledby="s6-heading" className="surface-card p-5">
            <h2 id="s6-heading" className="text-2xl font-bold">
              Application ready
            </h2>
            <ul className="mt-4 space-y-2">
              {[
                ["Personal Information", Boolean(data.fullName && data.email)],
                ["Resume", Boolean(data.resumeName || data.resumeText)],
                ["Accessibility Preferences", true],
                ["Identity Preferences", true],
                ["Application Questions", true],
              ].map(([label, ok]) => (
                <li key={String(label)} className="flex items-center gap-2 text-sm">
                  {ok ? (
                    <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-success" />
                  ) : (
                    <EyeOff aria-hidden="true" className="size-4 shrink-0 text-warning" />
                  )}
                  <span>
                    {label} <span className="sr-only">{ok ? "complete" : "incomplete"}</span>
                    <span className="text-muted-foreground">
                      — {ok ? "✓ complete" : "not provided (optional)"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <SharingPreview data={data} />

          <section aria-labelledby="rev-acc-heading" className="surface-card p-5">
            <h3 id="rev-acc-heading" className="text-lg font-semibold">
              Accommodation request
            </h3>
            <p className="mt-2 text-sm">
              {data.accommodations.length
                ? data.requestText.trim() ||
                  data.accNote.trim() ||
                  fallbackAccommodationRequest(data.accommodations, job.title)
                : "No accommodations requested."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Will be{" "}
              {data.shareRequests ? "shared with the employer" : "kept private on AccessPath"}.
            </p>
          </section>

          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="min-h-11"
                onClick={() => goToStep(i)}
              >
                <Pencil aria-hidden="true" />
                Edit {STEPS[i]}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="min-h-11" onClick={() => goToStep(4)}>
              Back
            </Button>
            <Button
              className="min-h-11"
              disabled={!data.fullName.trim() || !data.email.trim()}
              onClick={submit}
            >
              Submit Application
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Demo application — submitted to a simulated employer on this device. No external
            employer system is contacted.
          </p>
        </div>
      )}

      {/* Navigation */}
      {step < 5 && (
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            className="min-h-11"
            disabled={step === 0}
            onClick={() => goToStep(step - 1)}
          >
            Back
          </Button>
          <Button className="min-h-11" disabled={!canContinue} onClick={() => goToStep(step + 1)}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}

/* The wizard only needs pieces of app-state; kept local to avoid widening State. */
function useWizardDeps() {
  const { profile, saveProfile, apply } = useAppState();
  return { profile, saveProfile, apply };
}
