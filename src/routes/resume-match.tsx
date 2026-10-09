import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  Sparkles,
  Search,
  CheckCircle2,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  X,
} from "lucide-react";
import { useAppState } from "@/lib/app-state";
import { recommendJobs } from "@/lib/search";
import { accessibilityFit } from "@/lib/accessibility";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/resume-match")({
  component: ResumeMatchPage,
});

function ResumeMatchPage() {
  const { profile, updateProfile } = useAppState();
  const [newSkill, setNewSkill] = useState("");
  const [resumeSnippet, setResumeSnippet] = useState(profile.resumeText || "");

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !profile.skills.includes(trimmed)) {
      updateProfile({ skills: [...profile.skills, trimmed] });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    updateProfile({
      skills: profile.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleUpdateResume = () => {
    updateProfile({ resumeText: resumeSnippet });
  };

  const recommendations = recommendJobs(profile, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header Banner */}
      <div className="surface-card p-6 sm:p-8 rounded-3xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-xs font-semibold text-brand">
              <Sparkles className="size-3.5" />
              <span>Skills &amp; Accommodation Matcher</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Resume &amp; Role Fit Engine
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Match your verified competencies and workplace accommodations against thousands of inclusive openings across India without disclosing personal disability details.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2 text-xs">
              <Link to="/profile">
                Profile Settings
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-2 text-xs bg-[#7BD3C2] text-[#141817] hover:bg-[#68c5b3] font-semibold">
              <Link to="/jobs">
                Browse All Jobs
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Candidate Profile & Skills Input */}
        <div className="space-y-6">
          <Card className="surface-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>Active Skills</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {profile.skills.length} skills
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="text-xs pr-1 py-1 gap-1 items-center bg-secondary hover:bg-secondary/80"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="rounded p-0.5 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                      aria-label={`Remove skill ${skill}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <form onSubmit={handleAddSkill} className="flex gap-2 pt-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add skill (e.g. Python, SQL)"
                  className="text-xs h-9"
                />
                <Button type="submit" size="sm" variant="secondary" className="h-9 px-3 shrink-0">
                  <Plus className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Resume Text Analyzer */}
          <Card className="surface-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="size-4 text-brand" />
                <span>Resume Excerpt</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Paste your resume summary or key accomplishments to enhance keyword scoring.
              </p>
              <Textarea
                rows={4}
                value={resumeSnippet}
                onChange={(e) => setResumeSnippet(e.target.value)}
                placeholder="Paste experience highlights, technical stacks, or project summaries..."
                className="text-xs font-mono"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleUpdateResume}
                className="w-full text-xs"
              >
                Sync with Matches
              </Button>
            </CardContent>
          </Card>

          {/* Privacy Guarantee */}
          <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <ShieldCheck className="size-4 text-brand" />
              <span>Privacy Shield</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Match calculation runs strictly on client device memory. Your specific disability category or medical history is never required or inferred.
            </p>
          </div>
        </div>

        {/* Right: Job Recommendations & Scores */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">
              Top Role Matches ({recommendations.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              Ranked by skill synergy &amp; preference alignment
            </span>
          </div>

          <div className="space-y-4">
            {recommendations.map(({ job, score }) => {
              const fit = accessibilityFit(profile.accessibilityPreferences, job);
              return (
                <article
                  key={job.id}
                  className="surface-card rounded-2xl border border-border p-5 transition-all hover:border-brand/60 hover:shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <Building2 className="size-3.5" />
                          {job.company}
                        </span>
                        {(job.transparencyLevel === "verified" || job.accessSource === "Verified by AccessPath") && (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px]"
                          >
                            <CheckCircle2 className="size-3 mr-1" />
                            Verified PwD
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-display text-lg font-bold text-foreground">
                        <Link to={`/jobs/${job.id}` as any} className="hover:text-brand transition-colors">
                          {job.title}
                        </Link>
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5 text-brand" />
                          {job.city}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {job.workMode}
                        </span>
                        {job.salary && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-foreground">{job.salary}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand/10 text-brand font-bold text-xs">
                          <Sparkles className="size-3" />
                          Score: {score}
                        </div>
                        {fit.fitScore > 0 && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                            {fit.fitScore}% Accommodations Fit
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills synergy */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.requiredSkills.map((reqSkill) => {
                      const isMatched = profile.skills.some(
                        (s) =>
                          s.toLowerCase() === reqSkill.toLowerCase() ||
                          reqSkill.toLowerCase().includes(s.toLowerCase())
                      );
                      return (
                        <span
                          key={reqSkill}
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${
                            isMatched
                              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {isMatched ? "✓ " : ""}
                          {reqSkill}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                    <span className="text-muted-foreground">
                      Category: <strong>{job.category}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                        <Link to={`/jobs/${job.id}` as any}>
                          Details
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        className="h-8 text-xs bg-[#7BD3C2] text-[#141817] hover:bg-[#68c5b3] font-semibold"
                      >
                        <Link to={`/apply/${job.id}` as any}>
                          Apply Now
                          <ArrowRight className="size-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
