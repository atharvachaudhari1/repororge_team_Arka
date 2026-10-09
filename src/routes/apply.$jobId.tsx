import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { MatchPill } from "@/components/match-insights";
import { ApplicationWizard } from "@/components/application-wizard";
import { useAppState } from "@/lib/app-state";
import { scoreJob } from "@/lib/matching";

export const Route = createFileRoute("/apply/$jobId")({
  head: () => ({
    meta: [
      { title: "Apply with AccessPath" },
      {
        name: "description",
        content:
          "A guided, accessible application flow with identity and privacy control, optional accommodation requests and voice assistance.",
      },
      { property: "og:title", content: "Apply with AccessPath" },
      {
        property: "og:description",
        content:
          "Complete your application step by step — you decide what is shared, what stays private.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  const { jobId } = Route.useParams();
  const { findJob, profile, hasApplied } = useAppState();
  const job = findJob(jobId);

  const match = useMemo(() => (job ? scoreJob(profile, job) : null), [job, profile]);

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">This job is no longer available</h1>
        <Button asChild className="mt-4">
          <Link to="/jobs" search={{ q: "" }}>
            Back to job search
          </Link>
        </Button>
      </div>
    );
  }

  const applied = hasApplied(job.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        to="/jobs/$jobId"
        params={{ jobId: job.id }}
        className="text-sm font-medium text-brand hover:underline"
      >
        ← Back to job details
      </Link>
      <h1 className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-3xl font-bold">
        Apply with AccessPath: {job.title}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {job.company} • {job.city} • {job.workMode}
      </p>
      {match ? (
        <p className="mt-3">
          <MatchPill score={match.total} />
        </p>
      ) : null}
      <p className="mt-2 text-sm text-muted-foreground">
        Demo application — submitted on this device only. No external employer system is contacted.
      </p>

      {applied ? (
        <div className="surface-card mt-6 p-5">
          <h2 className="font-semibold">You have already applied to this role</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track its simulated status in your application tracker.
          </p>
          <Button asChild className="mt-3">
            <Link to="/applications">View my applications</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <ApplicationWizard job={job} />
        </div>
      )}
    </div>
  );
}
