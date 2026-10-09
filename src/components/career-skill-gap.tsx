import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAppState, type SkillGapItem } from "@/lib/app-state";
import { generateSkillGap } from "@/lib/ai.functions";

function SkillBadge({ item }: { item: SkillGapItem }) {
  if (item.status === "strong") {
    return (
      <li className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2">
        <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-success" />
        <span className="text-sm font-medium">{item.skill}</span>
      </li>
    );
  }
  if (item.status === "develop") {
    return (
      <li className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2">
        <AlertTriangle aria-hidden="true" className="size-4 shrink-0 text-warning" />
        <span className="text-sm font-medium">{item.skill}</span>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2">
      <HelpCircle aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        {item.skill} — not enough information to determine this skill.
      </span>
    </li>
  );
}

export function SkillGapAnalysis() {
  const { profile, selectedCareer, skillGap, setSkillGap } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generate = useServerFn(generateSkillGap);

  const handleGenerate = async () => {
    if (!selectedCareer) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generate({
        data: {
          profileSkills: profile.skills,
          careerTitle: selectedCareer,
        },
      });
      if (res.ok) {
        setSkillGap({
          careerTitle: res.careerTitle,
          strongSkills: res.strongSkills,
          skillsToDevelop: res.skillsToDevelop,
        });
      } else {
        setError(res.error);
      }
    } catch {
      setError("AI skill analysis is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCareer) return null;

  if (!skillGap && !loading && !error) {
    return (
      <div className="surface-card p-6 text-center">
        <ShieldCheck aria-hidden="true" className="mx-auto size-10 text-brand" />
        <h2 className="mt-3 text-xl font-semibold">Skill Gap Analysis</h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
          Compare your skills against the requirements for{" "}
          <span className="font-medium">{selectedCareer}</span>.
        </p>
        <Button onClick={handleGenerate} size="lg" className="mt-6 min-h-11">
          <Sparkles aria-hidden="true" />
          Analyse My Skills
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          AI-generated skill analysis — uses your profile skills only.
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
            Analysing your skills against {selectedCareer} requirements...
          </p>
        </div>
      )}

      {error && (
        <div className="surface-card border-destructive/30 bg-destructive/5 p-5">
          <h2 className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle aria-hidden="true" className="size-5" />
            Skill analysis unavailable
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleGenerate} variant="outline" className="mt-3 min-h-11">
            Try again
          </Button>
        </div>
      )}

      {!loading && skillGap && (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Skill Gap Analysis</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Target: <span className="font-medium">{skillGap.careerTitle}</span>
              </p>
            </div>
            <Button onClick={handleGenerate} variant="outline" size="sm" className="min-h-11">
              Regenerate
            </Button>
          </div>

          <div className="surface-card p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-success">
              <CheckCircle2 aria-hidden="true" className="size-5" />
              Strong Skills
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Skills from your profile that align with {skillGap.careerTitle}.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {skillGap.strongSkills.map((item) => (
                <SkillBadge key={item.skill} item={item} />
              ))}
            </ul>
          </div>

          <div className="surface-card p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-warning">
              <AlertTriangle aria-hidden="true" className="size-5" />
              Skills To Develop
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Skills commonly required for {skillGap.careerTitle} that aren't in your profile.
              Adding these improves your match score.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {skillGap.skillsToDevelop.map((item) => (
                <SkillBadge key={item.skill} item={item} />
              ))}
            </ul>
          </div>

          <div className="surface-card border-brand/20 bg-brand-soft/30 p-5">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">AI-generated skill analysis</span> — compares your
              profile skills against typical requirements for {skillGap.careerTitle}. If your
              profile doesn't contain enough information, some skills show as "unknown". This is not
              a qualification or employability assessment.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
