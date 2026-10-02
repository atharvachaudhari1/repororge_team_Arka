import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Map,
  Play,
  Sparkles,
} from "lucide-react";
import { useAppState, type RoadmapMilestone } from "@/lib/app-state";
import { generateRoadmap } from "@/lib/ai.functions";

const STATUS_CONFIG: Record<
  RoadmapMilestone["status"],
  { icon: typeof CheckCircle2; label: string; color: string; bg: string }
> = {
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-success",
    bg: "bg-success/10 border-success/30",
  },
  in_progress: {
    icon: Play,
    label: "In Progress",
    color: "text-brand",
    bg: "bg-brand/10 border-brand/30",
  },
  not_started: {
    icon: Circle,
    label: "Not Started",
    color: "text-muted-foreground",
    bg: "bg-background border-border",
  },
};

function MilestoneCard({
  milestone,
  onStatusChange,
}: {
  milestone: RoadmapMilestone;
  onStatusChange: (id: string, status: RoadmapMilestone["status"]) => void;
}) {
  const config = STATUS_CONFIG[milestone.status];
  const Icon = config.icon;

  return (
    <article
      className={`surface-card p-5 transition-colors ${config.bg}`}
      aria-labelledby={`milestone-${milestone.id}-title`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${config.bg}`}
          >
            <Icon aria-hidden="true" className={`size-5 ${config.color}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Week {milestone.week}</p>
            <h3 id={`milestone-${milestone.id}-title`} className="text-lg font-semibold">
              {milestone.title}
            </h3>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color}`}
        >
          <Icon aria-hidden="true" className="size-3" />
          {config.label}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <h4 className="text-sm font-medium">What to do</h4>
          <p className="mt-1 text-sm text-muted-foreground">{milestone.whatToDo}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium">Why it matters</h4>
          <p className="mt-1 text-sm text-muted-foreground">{milestone.whyItMatters}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium">Expected outcome</h4>
          <p className="mt-1 text-sm text-muted-foreground">{milestone.expectedOutcome}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {milestone.status !== "completed" && (
          <Button
            variant="outline"
            size="sm"
            className="min-h-9"
            onClick={() =>
              onStatusChange(
                milestone.id,
                milestone.status === "not_started" ? "in_progress" : "completed",
              )
            }
          >
            {milestone.status === "not_started" ? (
              <>
                <Play aria-hidden="true" />
                Start
              </>
            ) : (
              <>
                <CheckCircle2 aria-hidden="true" />
                Mark Complete
              </>
            )}
          </Button>
        )}
        {milestone.status === "in_progress" && (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-9"
            onClick={() => onStatusChange(milestone.id, "not_started")}
          >
            <Circle aria-hidden="true" />
            Reset
          </Button>
        )}
        {milestone.status === "completed" && (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-9"
            onClick={() => onStatusChange(milestone.id, "in_progress")}
          >
            <Clock aria-hidden="true" />
            Reopen
          </Button>
        )}
      </div>
    </article>
  );
}

export function CareerRoadmapUI() {
  const { selectedCareer, skillGap, roadmap, setRoadmap, updateMilestoneStatus } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generate = useServerFn(generateRoadmap);

  const handleGenerate = async () => {
    if (!selectedCareer) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generate({
        data: {
          careerTitle: selectedCareer,
          skillsToDevelop: skillGap?.skillsToDevelop.map((s) => s.skill) ?? [],
        },
      });
      if (res.ok) {
        setRoadmap({
          careerTitle: res.careerTitle,
          milestones: res.milestones,
        });
      } else {
        setError(res.error);
      }
    } catch {
      setError("AI roadmap generation is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCareer) return null;

  const completedCount = roadmap
    ? roadmap.milestones.filter((m) => m.status === "completed").length
    : 0;
  const totalCount = roadmap ? roadmap.milestones.length : 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!roadmap && !loading && !error) {
    return (
      <div className="surface-card p-6 text-center">
        <Map aria-hidden="true" className="mx-auto size-10 text-brand" />
        <h2 className="mt-3 text-xl font-semibold">30-Day Career Roadmap</h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
          Get a personalised 4-week plan to build the skills needed for{" "}
          <span className="font-medium">{selectedCareer}</span>.
        </p>
        <Button onClick={handleGenerate} size="lg" className="mt-6 min-h-11">
          <Sparkles aria-hidden="true" />
          Generate My Roadmap
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          AI-generated learning plan — not an official certification path.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loading && (
        <div className="surface-card p-8 text-center">
          <Loader2 aria-hidden="true" className="mx-auto size-8 animate-spin text-brand" />
          <p className="mt-3 text-sm text-muted-foreground">
            Building your 30-day roadmap for {selectedCareer}...
          </p>
        </div>
      )}

      {error && (
        <div className="surface-card border-destructive/30 bg-destructive/5 p-5">
          <h2 className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle aria-hidden="true" className="size-5" />
            Roadmap generation unavailable
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleGenerate} variant="outline" className="mt-3 min-h-11">
            Try again
          </Button>
        </div>
      )}

      {!loading && roadmap && (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Your 30-Day Roadmap</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Target: <span className="font-medium">{roadmap.careerTitle}</span>
              </p>
            </div>
            <Button onClick={handleGenerate} variant="outline" size="sm" className="min-h-11">
              Regenerate
            </Button>
          </div>

          <div className="surface-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Progress</h3>
              <span className="text-sm font-medium">
                {completedCount} / {totalCount} milestones
              </span>
            </div>
            <Progress
              value={progressPct}
              className="mt-2 h-2"
              aria-label={`Roadmap progress ${progressPct}%`}
            />
            {completedCount === totalCount && totalCount > 0 && (
              <p className="mt-2 text-sm font-medium text-success">
                All milestones completed! You've built a strong foundation for {roadmap.careerTitle}
                .
              </p>
            )}
          </div>

          <ol className="space-y-4" aria-label="Roadmap milestones">
            {roadmap.milestones.map((m) => (
              <li key={m.id}>
                <MilestoneCard milestone={m} onStatusChange={updateMilestoneStatus} />
              </li>
            ))}
          </ol>

          <p className="text-xs text-muted-foreground">
            AI-generated learning plan. Progress is saved on this device. This roadmap supports your
            career development and is not an official certification.
          </p>
        </>
      )}
    </div>
  );
}
