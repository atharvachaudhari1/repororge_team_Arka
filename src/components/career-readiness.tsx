import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Gauge,
  Map,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useAppState } from "@/lib/app-state";

/**
 * Career Readiness — an AI-derived estimate of how close the user's profile is
 * to their selected career. NOT an official qualification, never used to rank
 * or reject candidates, and never influenced by identity data.
 */
export function CareerReadiness() {
  const { selectedCareer, skillGap, roadmap, careerDiscoveries } = useAppState();

  const readiness = useMemo(() => {
    if (!selectedCareer || !skillGap) return null;
    const total = skillGap.strongSkills.length + skillGap.skillsToDevelop.length;
    if (total === 0) return null;
    // Deterministic estimate: strong skills vs total known skills, blended with
    // roadmap progress. Only job-related evidence is used.
    const skillPart = skillGap.strongSkills.length / total;
    const roadmapPart =
      roadmap && roadmap.milestones.length
        ? roadmap.milestones.filter((m) => m.status === "completed").length /
          roadmap.milestones.length
        : 0;
    const score = Math.round(Math.min(100, skillPart * 80 + roadmapPart * 20));
    return {
      score,
      strongest: skillGap.strongSkills[0]?.skill ?? "",
      topGap: skillGap.skillsToDevelop[0]?.skill ?? "",
      completed: roadmap ? roadmap.milestones.filter((m) => m.status === "completed").length : 0,
      total: roadmap?.milestones.length ?? 0,
      nextAction: skillGap.skillsToDevelop[0]?.skill
        ? `Practice ${skillGap.skillsToDevelop[0].skill}`
        : (roadmap?.milestones.find((m) => m.status !== "completed")?.title ??
          "Find matching jobs and start applying"),
    };
  }, [selectedCareer, skillGap, roadmap]);

  if (!selectedCareer || !readiness) return null;

  const discovery = careerDiscoveries.find((c) => c.title === selectedCareer);

  return (
    <section
      aria-labelledby="readiness-heading"
      className="surface-card border-brand/30 bg-brand-soft p-5"
    >
      <h2 id="readiness-heading" className="flex items-center gap-2 text-xl font-semibold">
        <Gauge aria-hidden="true" className="size-5 text-brand" />
        My Career Readiness
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Target: <span className="font-medium text-foreground">{selectedCareer}</span>
      </p>

      <div className="mt-4">
        <div className="flex items-end justify-between gap-3">
          <p className="text-4xl font-bold" aria-live="polite">
            {readiness.score}%
          </p>
          <p className="pb-1 text-xs text-muted-foreground">AI-generated readiness estimate</p>
        </div>
        <Progress
          value={readiness.score}
          className="mt-2 h-2"
          aria-label={`Career readiness ${readiness.score} percent`}
        />
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-background p-3">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Trophy aria-hidden="true" className="size-3.5 text-success" />
            Strongest skill
          </dt>
          <dd className="mt-1 text-sm font-semibold">
            {readiness.strongest || "Not enough information yet"}
          </dd>
        </div>
        <div className="rounded-md border border-border bg-background p-3">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <AlertTriangle aria-hidden="true" className="size-3.5 text-warning" />
            Top skill gap
          </dt>
          <dd className="mt-1 text-sm font-semibold">{readiness.topGap || "None identified"}</dd>
        </div>
        <div className="rounded-md border border-border bg-background p-3">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Map aria-hidden="true" className="size-3.5 text-brand" />
            Roadmap
          </dt>
          <dd className="mt-1 flex items-center gap-2 text-sm font-semibold">
            <span>
              {readiness.completed} / {readiness.total} milestones completed
            </span>
          </dd>
        </div>
        <div className="rounded-md border border-border bg-background p-3">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles aria-hidden="true" className="size-3.5 text-brand" />
            Next action
          </dt>
          <dd className="mt-1 text-sm font-semibold">{readiness.nextAction}</dd>
        </div>
      </dl>

      {discovery ? (
        <p className="mt-4 text-sm text-muted-foreground">
          <span className="font-medium">Why this target fits:</span> {discovery.why}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm" className="min-h-11">
          <Link to="/jobs" search={{ q: selectedCareer }}>
            <Briefcase aria-hidden="true" />
            Find Matching Jobs
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="min-h-11">
          <Link to="/resume-match">
            <CheckCircle2 aria-hidden="true" />
            Check my resume against a job
          </Link>
        </Button>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        This is NOT an official qualification. It is a self-reflection estimate built from your
        skills and roadmap progress only. It is never used to reject or rank candidates, and never
        considers disability, gender identity, or any protected characteristic. You remain the final
        decision-maker.
      </p>
    </section>
  );
}
