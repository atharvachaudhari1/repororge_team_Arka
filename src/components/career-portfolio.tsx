import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FolderGit2, Loader2, Plus, Sparkles, Target } from "lucide-react";
import { useAppState } from "@/lib/app-state";
import { generatePortfolioProject } from "@/lib/ai.functions";

export function PortfolioProjectCard() {
  const {
    selectedCareer,
    profile,
    skillGap,
    portfolioProject,
    setPortfolioProject,
    roadmap,
    setRoadmap,
  } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generate = useServerFn(generatePortfolioProject);

  const handleGenerate = async () => {
    if (!selectedCareer) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generate({
        data: {
          careerTitle: selectedCareer,
          profileSkills: profile.skills,
          skillsToDevelop: skillGap?.skillsToDevelop.map((s) => s.skill) ?? [],
        },
      });
      if (res.ok) {
        setPortfolioProject({
          title: res.title,
          projectGoal: res.projectGoal,
          recommendedFeatures: res.recommendedFeatures,
          skillsPracticed: res.skillsPracticed,
          expectedOutcome: res.expectedOutcome,
        });
      } else {
        setError(res.error);
      }
    } catch {
      setError("AI project recommendation is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const addToRoadmap = () => {
    if (!roadmap || !portfolioProject) return;
    const alreadyAdded = roadmap.milestones.some((m) => m.id === "milestone-portfolio");
    if (alreadyAdded) {
      toast.info("The portfolio project is already in your roadmap.");
      return;
    }
    setRoadmap({
      ...roadmap,
      milestones: [
        ...roadmap.milestones,
        {
          id: "milestone-portfolio",
          week: roadmap.milestones.length + 1,
          title: portfolioProject.title,
          whatToDo: `Build "${portfolioProject.title}". ${portfolioProject.projectGoal} Recommended features: ${portfolioProject.recommendedFeatures.join(", ")}.`,
          whyItMatters:
            "A practical project demonstrates your skills to employers and fills the gaps identified in your analysis.",
          expectedOutcome: portfolioProject.expectedOutcome,
          status: "not_started" as const,
        },
      ],
    });
    toast.success("Portfolio project added to your career roadmap");
  };

  if (!selectedCareer) return null;

  if (!portfolioProject && !loading && !error) {
    return (
      <div className="surface-card p-6 text-center">
        <FolderGit2 aria-hidden="true" className="mx-auto size-10 text-brand" />
        <h2 className="mt-3 text-xl font-semibold">Build My Portfolio Project</h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
          Get one practical project recommendation based on{" "}
          <span className="font-medium">{selectedCareer}</span>, your existing skills and your skill
          gaps.
        </p>
        <Button onClick={handleGenerate} size="lg" className="mt-6 min-h-11">
          <Sparkles aria-hidden="true" />
          Recommend My Project
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          AI-generated suggestion — you decide whether and how to build it.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="portfolio-heading" className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="portfolio-heading" className="flex items-center gap-2 text-xl font-semibold">
            <FolderGit2 aria-hidden="true" className="size-5 text-brand" />
            Build My Portfolio Project
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One practical project, matched to {selectedCareer}.
          </p>
        </div>
        {!loading && (
          <Button onClick={handleGenerate} variant="outline" size="sm" className="min-h-11">
            Regenerate
          </Button>
        )}
      </div>

      {loading && (
        <div className="mt-6 py-6 text-center">
          <Loader2 aria-hidden="true" className="mx-auto size-8 animate-spin text-brand" />
          <p className="mt-3 text-sm text-muted-foreground">
            Finding a project that fits your skills and gaps...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle aria-hidden="true" className="size-4" />
            AI recommendations are temporarily unavailable.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleGenerate} variant="outline" className="mt-3 min-h-11">
            Try again
          </Button>
        </div>
      )}

      {portfolioProject && !loading && (
        <article className="mt-5 rounded-md border border-border bg-background p-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Target aria-hidden="true" className="size-4 text-brand" />
            {portfolioProject.title}
          </h3>

          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium">Project goal</h4>
              <p className="mt-1 text-sm text-muted-foreground">{portfolioProject.projectGoal}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium">Recommended features</h4>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {portfolioProject.recommendedFeatures.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium">Skills practiced</h4>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {portfolioProject.skillsPracticed.map((s) => (
                  <li
                    key={s}
                    className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium">Expected outcome</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {portfolioProject.expectedOutcome}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {roadmap ? (
              <Button onClick={addToRoadmap} size="sm" className="min-h-11">
                <Plus aria-hidden="true" />
                Add to Career Roadmap
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Generate a roadmap first to add this project as a milestone.
              </p>
            )}
          </div>
        </article>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        AI-generated project suggestion based on your target career, existing skills and skill gaps.
        You remain the final decision-maker on what to build.
      </p>
    </section>
  );
}
