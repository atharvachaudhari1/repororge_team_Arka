import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile, Application } from "@/lib/app-state";
import type { Job } from "@/lib/jobs-data";
import { rankJobs } from "@/lib/matching";
import { accessibilityFit } from "@/lib/accessibility";

type Step = { title: string; body: string; cta: string; to: string };

/** Picks the single most useful next action from real profile and match data. */
export function nextStep(
  profile: Profile,
  jobs: Job[],
  applications: Application[],
  savedJobs: string[],
): Step {
  const ranked = rankJobs(profile, jobs, 10);
  const strong = ranked.filter((r) => r.total >= 90);

  if (!profile.skills.length || !profile.experienceBand)
    return {
      title: "Finish your profile to unlock matches",
      body: "Add your skills and experience level — those two fields drive every match score.",
      cta: "Complete profile",
      to: "/profile",
    };

  if (!profile.accessibilityPreferences.length)
    return {
      title: "Set your accessibility preferences",
      body: "Choosing what support matters to you unlocks an Accessibility Fit on every role. It stays private.",
      cta: "Choose preferences",
      to: "/profile",
    };

  if (strong.length >= 1 && applications.length === 0)
    return {
      title: `${strong.length} ${strong.length === 1 ? "job matches" : "jobs match"} your profile above 90%`,
      body: `Strongest right now: ${strong[0]!.job.title} at ${strong[0]!.job.company}.`,
      cta: "View matches",
      to: "/jobs",
    };

  const gap = ranked.find((r) => r.missingRequired.length >= 2);
  if (gap && !profile.resumeText)
    return {
      title: "Your resume is missing skills from your target jobs",
      body: `For ${gap.job.title}, employers list ${gap.missingRequired.slice(0, 2).join(" and ")}. Run a resume match to get rewritten bullets.`,
      cta: "Improve resume",
      to: "/resume-match",
    };

  const savedJob = savedJobs.map((id) => jobs.find((j) => j.id === id)).find(Boolean);
  if (savedJob && !applications.some((a) => a.jobId === savedJob.id)) {
    const fit = accessibilityFit(profile.accessibilityPreferences, savedJob);
    return {
      title: `Review your saved role: ${savedJob.title}`,
      body: `${fit.hasPreferences ? `${fit.score}% Accessibility Fit. ` : ""}Check the accessibility details, then apply when you're ready.`,
      cta: "Review application",
      to: "/saved",
    };
  }

  if (applications.length)
    return {
      title: "Keep your applications moving",
      body: `You have ${applications.length} ${applications.length === 1 ? "application" : "applications"} in progress. Add private accessibility feedback after each stage.`,
      cta: "Open tracker",
      to: "/applications",
    };

  return {
    title: "Explore your strongest matches",
    body: ranked[0]
      ? `${ranked[0].job.title} at ${ranked[0].job.company} is your top match at ${ranked[0].total}%.`
      : "Browse inclusive roles across India.",
    cta: "View matches",
    to: "/jobs",
  };
}

export function NextStepCard({
  profile, jobs, applications, savedJobs,
}: { profile: Profile; jobs: Job[]; applications: Application[]; savedJobs: string[] }) {
  const step = nextStep(profile, jobs, applications, savedJobs);
  return (
    <section
      aria-labelledby="next-step-heading"
      className="surface-card border-brand/30 bg-brand-soft p-5"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-brand">
        <Compass aria-hidden="true" className="size-4" />
        Your next step
      </p>
      <h2 id="next-step-heading" className="mt-2 text-xl font-semibold">{step.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
      <Button asChild className="mt-4 min-h-11">
        {step.to === "/jobs" ? (
          <Link to="/jobs" search={{ q: "" }}>
            {step.cta}
            <ArrowRight aria-hidden="true" />
          </Link>
        ) : (
          <Link to={step.to}>
            {step.cta}
            <ArrowRight aria-hidden="true" />
          </Link>
        )}
      </Button>
    </section>
  );
}
