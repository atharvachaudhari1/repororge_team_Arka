import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark, BookmarkCheck, FileText, LayoutList, RefreshCcw, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getJob } from "@/lib/jobs-data";
import { useAppState } from "@/lib/app-state";
import { MatchScoreCard, WhyThisJob, MatchPill } from "@/components/match-insights";
import { scoreJob } from "@/lib/matching";
import { accessibilityFit } from "@/lib/accessibility";
import { AccessibilityFitCard, AccessibilityTransparencyCard } from "@/components/transparency";
import { AccessibleJobView } from "@/components/accessible-job-view";
import { JobListen } from "@/components/job-listen";
import { BeforeYouApply } from "@/components/before-you-apply";
import { EmployerInclusionCard } from "@/components/employer-inclusion";
import { WorkplaceCompass } from "@/components/workplace-compass";
import { ConfidenceCheck } from "@/components/confidence-check";
import { EmployerAccessibilityAuditModal } from "@/components/employer-accessibility-audit";
import { MatchExplainerModal } from "@/components/match-explainer-modal";

export const Route = createFileRoute("/jobs/$jobId")({
  loader: ({ params }) => {
    const job = getJob(params.jobId);
    return job ? { job } : null;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Job unavailable — AccessPath" }, { name: "robots", content: "noindex" }],
      };
    }
    const { job } = loaderData;
    const title = `${job.title} at ${job.company} — AccessPath`;
    const description = `${job.workMode} • ${job.city} • ${job.experience}. Accessibility and inclusion details ${job.accessSource.toLowerCase()}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: JobDetails,
});

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

function JobDetails() {
  const data = Route.useLoaderData();
  const { jobId } = Route.useParams();
  const { isSaved, toggleSaved, hasApplied, findJob, profile } = useAppState();
  const [accessibleView, setAccessibleView] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  // Context first, so employer transparency updates are reflected immediately.
  const job = findJob(jobId) ?? data?.job;

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">This job could not be found</h1>
        <p className="mt-2 text-muted-foreground">The listing may have been removed.</p>
        <Button asChild className="mt-4">
          <Link to="/jobs" search={{ q: "" }}>
            Back to job search
          </Link>
        </Button>
      </div>
    );
  }

  const match = scoreJob(profile, job);
  const fit = accessibilityFit(profile.accessibilityPreferences, job);
  const saved = isSaved(job.id);
  const applied = hasApplied(job.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        to="/jobs"
        search={{ q: "" }}
        className="text-sm font-medium text-brand hover:underline"
      >
        ← Back to job search
      </Link>

      <EmployerAccessibilityAuditModal job={job} open={auditOpen} onOpenChange={setAuditOpen} />
      <MatchExplainerModal
        match={match}
        open={explainOpen}
        onOpenChange={setExplainOpen}
        accessibilityFitScore={fit.score}
      />

      <header className="surface-card mt-4 p-5 sm:p-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{job.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {job.company} • {job.city} • {job.workMode} • {job.employment} • {job.experience}
          {job.salary ? ` • ${job.salary}` : ""}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <MatchPill score={match.total} />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 text-brand font-semibold hover:underline"
            onClick={() => setExplainOpen(true)}
          >
            <Sparkles className="size-3.5" />
            Explain Match
          </Button>
          {fit.hasPreferences ? (
            <span className="inline-flex items-center rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand">
              {fit.score}% Accessibility Fit
            </span>
          ) : null}
          {job.accessUpdated ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
              <RefreshCcw aria-hidden="true" className="size-3" />
              <span className="sr-only">Status: </span>
              Accessibility information updated
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {applied ? (
            <Button asChild variant="secondary" className="min-h-11">
              <Link to="/applications">Applied — track application</Link>
            </Button>
          ) : (
            <Button asChild className="min-h-11">
              <Link to="/apply/$jobId" params={{ jobId: job.id }}>
                Apply now
              </Link>
            </Button>
          )}
          <BeforeYouApply job={job} profile={profile} />
          <Button
            type="button"
            variant="outline"
            className="min-h-11 gap-1.5"
            onClick={() => setAuditOpen(true)}
          >
            <ShieldCheck className="size-4 text-brand" />
            Accessibility Audit
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            aria-pressed={saved}
            onClick={() => toggleSaved(job.id)}
          >
            {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
            {saved ? "Saved" : "Save job"}
          </Button>
        </div>

        <JobListen job={job} />
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <section aria-labelledby="desc-heading" className="surface-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="desc-heading" className="text-xl font-semibold">
                {accessibleView ? "Accessible view" : "Job description"}
              </h2>
              <Button
                variant={accessibleView ? "default" : "outline"}
                size="sm"
                className="min-h-11"
                aria-pressed={accessibleView}
                onClick={() => setAccessibleView((v) => !v)}
              >
                {accessibleView ? (
                  <FileText aria-hidden="true" />
                ) : (
                  <LayoutList aria-hidden="true" />
                )}
                {accessibleView ? "Original description" : "Accessible view"}
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Accessible view restructures the same information into short, labelled sections. The
              original description stays available.
            </p>

            {accessibleView ? (
              <AccessibleJobView job={job} />
            ) : (
              <div className="mt-4 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold">About the role</h3>
                  <p className="mt-2 text-sm">{job.about}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Responsibilities</h3>
                  <List items={job.responsibilities} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Required skills</h3>
                  <List items={job.requiredSkills} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Preferred skills</h3>
                  <List items={job.preferredSkills} />
                </div>
              </div>
            )}
          </section>

          <MatchScoreCard match={match} />
          <WhyThisJob match={match} />
          <AccessibilityFitCard job={job} preferences={profile.accessibilityPreferences} />
          <AccessibilityTransparencyCard job={job} />
          <WorkplaceCompass job={job} />
          <ConfidenceCheck job={job} profile={profile} />
          <EmployerInclusionCard job={job} />
        </div>

        <aside aria-label="Job summary" className="surface-card h-fit p-5">
          <h2 className="text-lg font-semibold">Job summary</h2>
          <dl className="mt-3 space-y-3 text-sm">
            {[
              ["Salary", job.salary ?? "Not disclosed"],
              ["Location", job.city],
              ["Work mode", job.workMode],
              ["Experience", job.experience],
              ["Employment", job.employment],
              ["Category", job.category],
              ["Posted", job.posted],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            You never need to disclose disability or gender identity to apply.
          </p>
        </aside>
      </div>
    </div>
  );
}
