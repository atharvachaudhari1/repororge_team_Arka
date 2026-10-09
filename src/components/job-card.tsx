import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Accessibility,
  Bookmark,
  BookmarkCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  IndianRupee,
  MapPin,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Eye,
  Ear,
  Hand,
  Brain,
  Heart,
  Train,
} from "lucide-react";
import { ACCESS_FEATURES, type Job } from "@/lib/jobs-data";
import { useAppState } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { scoreJob } from "@/lib/matching";
import { accessibilityFit } from "@/lib/accessibility";
import { calculateCommuteAccessibility } from "@/lib/commute";
import { MatchExplainerModal } from "@/components/match-explainer-modal";
import { EmployerAccessibilityAuditModal } from "@/components/employer-accessibility-audit";

/** Map access feature keys to disability category icons */
function getDisabilityIcons(access: string[]): { icon: typeof Eye; label: string }[] {
  const icons: { icon: typeof Eye; label: string }[] = [];
  if (
    access.some((a) => ["screen_reader", "keyboard_friendly", "accessible_application"].includes(a))
  )
    icons.push({ icon: Eye, label: "Vision accessible" });
  if (access.some((a) => ["captioned_meetings", "assistive_tech"].includes(a)))
    icons.push({ icon: Ear, label: "Hearing accessible" });
  if (
    access.some((a) =>
      ["remote_work", "flexible_work", "accessible_workplace", "accessible_interview"].includes(a),
    )
  )
    icons.push({ icon: Hand, label: "Mobility accessible" });
  return icons;
}

export function JobCard({ job }: { job: Job }) {
  const { isSaved, toggleSaved, profile } = useAppState();
  const navigate = useNavigate();
  const [showWhy, setShowWhy] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const saved = isSaved(job.id);
  const match = scoreJob(profile, job);
  const a11y = accessibilityFit(profile.accessibilityPreferences, job);
  const commute = calculateCommuteAccessibility(job, profile.commutePreferences);
  const disabilityIcons = getDisabilityIcons(job.access);

  // Compute skills match & gaps
  const userSkillsLower = (profile.skills || []).map((s) => s.toLowerCase());
  const matchedSkills = job.requiredSkills.filter((s) =>
    userSkillsLower.some((us) => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us)),
  );
  const missingSkills = job.requiredSkills.filter(
    (s) =>
      !userSkillsLower.some((us) => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us)),
  );
  const primaryGap = missingSkills[0] ?? (job.preferredSkills && job.preferredSkills[0]) ?? "";

  // Work preference alignment
  const workMatches =
    !profile.workPreference ||
    profile.workPreference === "No preference" ||
    profile.workPreference.toLowerCase() === job.workMode.toLowerCase();

  const openJobFromCard = () => {
    navigate({ to: "/jobs/$jobId", params: { jobId: job.id } });
  };

  return (
    <article
      data-job-card="true"
      data-job-id={job.id}
      data-gaze-target="job-card"
      onClick={(event) => {
        // A gaze dwell invokes click() on this card itself. Keep controls inside
        // the card independent, so saving, applying, and opening dialogs still
        // behave exactly as their own buttons intend.
        if (event.target === event.currentTarget) openJobFromCard();
      }}
      className="rounded-2xl border border-border bg-card p-6 transition-all hover:border-[#191716]/30 shadow-[0_2px_8px_rgba(0,0,0,0.02)] data-[active-card=true]:ring-2 data-[active-card=true]:ring-brand data-[active-card=true]:border-brand"
      aria-labelledby={`job-${job.id}-title`}
      aria-label={`Gaze-select ${job.title} at ${job.company}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id={`job-${job.id}-title`} className="font-serif text-xl font-normal text-foreground">
            <Link to="/jobs/$jobId" params={{ jobId: job.id }} className="hover:underline">
              {job.title}
            </Link>
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Building2 aria-hidden="true" className="size-4 text-stone-500" />
              {job.company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin aria-hidden="true" className="size-4 text-stone-500" />
              {job.city}
            </span>
            <span className="rounded-full border border-stone-300 dark:border-stone-700 px-2.5 py-0.5 text-xs">
              {job.workMode}
            </span>
            <span>{job.employment}</span>
            <span>{job.experience}</span>
            {job.salary ? (
              <span className="flex items-center gap-0.5 font-semibold text-foreground">
                <IndianRupee aria-hidden="true" className="size-3.5" />
                {job.salary.replace("₹", "")}
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-stone-300 dark:border-stone-700 bg-background text-foreground transition-colors hover:bg-secondary"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
          onClick={() => toggleSaved(job.id)}
        >
          {saved ? (
            <BookmarkCheck
              aria-hidden="true"
              className="size-4 text-stone-900 dark:text-stone-100"
            />
          ) : (
            <Bookmark aria-hidden="true" className="size-4 text-stone-500" />
          )}
        </button>
      </div>

      {/* Disability Accessibility Fit — Prominent Display */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Accessibility Fit Score (highlighted for PwD) */}
        {a11y.hasPreferences ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              a11y.score >= 80
                ? "bg-success/15 text-success"
                : a11y.score >= 50
                  ? "bg-warning/15 text-warning"
                  : "bg-destructive/10 text-destructive"
            }`}
          >
            <Accessibility className="size-3.5" />
            {a11y.score}% Accessibility Fit
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
            <ShieldCheck className="size-3.5" />
            {job.access.length} Accommodations
          </span>
        )}

        <button
          type="button"
          onClick={() => setExplainOpen(true)}
          className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-3 py-1 text-xs font-bold text-brand hover:bg-brand/25 transition-colors cursor-pointer"
          title="Explain match score with AI"
        >
          <Sparkles className="size-3.5" />
          {match.total}% Skills Fit &bull; Ask AI
        </button>

        {job.accessSource === "Discovered via TinyFish Web Search" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E5B34C]/20 text-[#191716] dark:text-stone-200 border border-[#E5B34C] px-2.5 py-1 text-xs font-semibold">
            <Sparkles className="size-3 text-[#CF4E3D]" />
            Live Web • TinyFish
          </span>
        )}

        {/* Commute Accessibility Pill */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${
            commute.overallScore >= 85
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
              : commute.overallScore >= 70
                ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
          }`}
          title={
            commute.isRemoteRole
              ? "100% Remote - Zero physical commute stress"
              : `${commute.workplace.businessPark}: ${
                  commute.workplace.nearestMetro
                    ? `${commute.workplace.nearestMetro.name} (${commute.workplace.nearestMetro.distanceMeters}m)`
                    : "Accessible transit feeder"
                }`
          }
        >
          {commute.isRemoteRole ? (
            <>
              <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
              100% Remote Commute
            </>
          ) : (
            <>
              <Train className="size-3 text-blue-600 dark:text-blue-400" />
              {commute.overallScore}% Commute
              {commute.workplace.commuteBenefits.companyCabService ? " • Cab" : ""}
            </>
          )}
        </span>

        {/* Disability category icons */}
        {disabilityIcons.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            title={label}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>

      {/* Skills list */}
      <p className="mt-3 text-sm">
        <span className="font-semibold text-muted-foreground">Required: </span>
        <span className="font-medium text-foreground">{job.requiredSkills.join(" • ")}</span>
      </p>

      {/* Disability Accommodation Badges — Prominent */}
      <div className="mt-2.5">
        <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
          <Accessibility className="size-3" />
          Disability Accommodations Provided:
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {job.access.map((a) => (
            <li key={a}>
              <Badge variant="secondary" className="font-normal text-xs py-0.5">
                <span aria-hidden="true" className="text-success mr-1">
                  ✓
                </span>
                {ACCESS_FEATURES[a]}
              </Badge>
            </li>
          ))}
          {job.access.length === 0 ? (
            <li className="text-xs text-muted-foreground italic">
              No accommodation information provided by employer
            </li>
          ) : null}
        </ul>
      </div>

      {/* "Why this matches?" — Disability-aware explainer */}
      <div className="mt-3.5 border-t border-border/60 pt-3">
        <button
          type="button"
          onClick={() => setShowWhy((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
          aria-expanded={showWhy}
        >
          <span>Why this matches your disability needs?</span>
          {showWhy ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>

        {showWhy ? (
          <div className="mt-2.5 rounded-lg border border-border/80 bg-secondary/40 p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success shrink-0" />
              <span>
                <strong>Skills matched: </strong>
                {matchedSkills.length > 0
                  ? matchedSkills.join(", ")
                  : "Profile foundation matches role requirements"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Accessibility className="size-4 text-success shrink-0" />
              <span>
                <strong>Disability accommodation fit: </strong>
                {a11y.hasPreferences
                  ? a11y.availableCount > 0
                    ? `${a11y.availableCount} of your ${a11y.preferenceCount} disability accommodation needs are provided by this employer`
                    : `This employer has not confirmed your specific accommodation needs. Consider contacting them.`
                  : `Employer provides ${job.access.length} disability accommodations. Set up your access needs in your profile to see your personal fit.`}
              </span>
            </div>

            {a11y.hasPreferences && a11y.missing.length > 0 ? (
              <div className="flex items-center gap-2 text-warning font-medium">
                <AlertCircle className="size-4 shrink-0" />
                <span>
                  <strong>Missing accommodations: </strong>
                  {a11y.missing.map((m) => m.label).join(", ")}
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success shrink-0" />
              <span>
                <strong>Work preference: </strong>
                {workMatches
                  ? `${job.workMode} setup aligns with your profile`
                  : `${job.workMode} work arrangement`}
              </span>
            </div>

            {primaryGap ? (
              <div className="flex items-center gap-2 text-warning font-medium">
                <AlertCircle className="size-4 shrink-0" />
                <span>
                  <strong>Skill gap to close: </strong>
                  {primaryGap}
                </span>
              </div>
            ) : null}

            <div className="mt-1 pt-1.5 border-t border-border/50 text-muted-foreground">
              <ShieldCheck className="size-3.5 inline mr-1 text-brand" />
              Accommodation source: {job.accessSource}. Ableo never infers disability or adds
              accommodation claims.
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/60">
        <span className="text-xs text-stone-500 font-sans">Posted {job.posted}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAuditOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border border-stone-300 dark:border-stone-700 bg-background px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-secondary transition-all"
            title="View WCAG & Accessibility Audit for this employer"
          >
            <ShieldCheck className="size-3.5 text-[#191716] dark:text-[#7BD3C2]" />
            Audit
          </button>
          <Link
            to="/jobs/$jobId"
            params={{ jobId: job.id }}
            className="rounded-full border border-stone-300 dark:border-stone-700 bg-background px-4 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-all"
          >
            View details
          </Link>
          <Link
            to="/apply/$jobId"
            params={{ jobId: job.id }}
            className="inline-flex items-center gap-1 rounded-full border border-[#191716] bg-[#7BD3C2] px-4 py-1.5 text-xs font-semibold text-[#141817] shadow-[1px_1px_0px_#141817] hover:bg-[#6ec2b1] transition-all"
          >
            Apply now
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      <MatchExplainerModal
        open={explainOpen}
        onOpenChange={setExplainOpen}
        match={match}
        accessibilityFitScore={a11y.score}
      />
      <EmployerAccessibilityAuditModal open={auditOpen} onOpenChange={setAuditOpen} job={job} />
    </article>
  );
}
