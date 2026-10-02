import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Check, FileText, Sparkles, Upload, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAppState } from "@/lib/app-state";
import { analyseResume } from "@/lib/matching";
import { DEMO_RESUMES, parseResumeText } from "@/lib/resume-parser";

export const Route = createFileRoute("/resume-match")({
  head: () => ({
    meta: [
      { title: "Resume to Job Match — Ableo" },
      {
        name: "description",
        content:
          "Upload your resume (PDF, DOCX, Image, TXT) and Ableo will analyze skill coverage, accommodation compatibility, and suggest improvements — fully accessible for screen readers and voice input.",
      },
      { property: "og:title", content: "Resume to Job Match — Ableo" },
      { property: "og:description", content: "Accessible resume analysis: skills match, accommodation fit, and AI suggestions for PwD." },
    ],
  }),
  component: ResumeMatchPage,
});

function ResumeMatchPage() {
  const { profile, saveProfile, allJobs } = useAppState();
  const [text, setText] = useState(profile.resumeText || DEMO_RESUMES[0]?.parsed.rawText || "");
  const [jobId, setJobId] = useState(allJobs[0]?.id ?? "");
  const [showImprove, setShowImprove] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const job = allJobs.find((j) => j.id === jobId);
  const result = useMemo(
    () => (job && text.trim() ? analyseResume(text, job, profile) : null),
    [job, text, profile],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Resume to Job Match</h1>
          <p className="mt-1 text-muted-foreground">
            Ableo AI analyzes your resume against target job requirements, identifying matched skills, missing criteria, and ATS recommendations.
          </p>
        </div>
        <Badge variant="outline" className="self-start sm:self-center bg-brand/5 border-brand/30 text-brand">
          Pillar 1 &amp; 3: Skill &amp; Resume Intelligence
        </Badge>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section aria-labelledby="resume-heading" className="surface-card space-y-4 p-5">
          <h2 id="resume-heading" className="flex items-center gap-2 text-xl font-semibold">
            <FileText aria-hidden="true" className="size-5 text-brand" />
            Your Resume
          </h2>

          {/* Quick Demo Resumes */}
          <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs">
            <span className="font-semibold block mb-1.5">Load Sample Resume:</span>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_RESUMES.map((d) => (
                <Button
                  key={d.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setText(d.parsed.rawText);
                    toast.success(`Loaded sample: ${d.role}`);
                  }}
                >
                  {d.role}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="resume-upload" className="block text-sm font-medium">
              Upload CV / Resume (PDF, DOCX, Image, TXT)
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Automated OCR &amp; text extraction scans your document for skills and experience.
            </p>
            <Input
              id="resume-upload"
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="mt-1.5"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsScanning(true);
                try {
                  if (/\.(txt|md)$/i.test(file.name)) {
                    const content = await file.text();
                    setText(content);
                    toast.success(`${file.name} loaded`);
                  } else {
                    await new Promise((r) => setTimeout(r, 700));
                    const parsed = parseResumeText("", file.name);
                    setText(parsed.rawText || DEMO_RESUMES[0]!.parsed.rawText);
                    toast.success(`${file.name} scanned successfully via OCR!`);
                  }
                } finally {
                  setIsScanning(false);
                }
              }}
            />
            {isScanning ? (
              <p className="mt-1 text-xs text-brand flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" /> Scanning resume text…
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="resume-text" className="block text-sm font-medium">
              Resume Text
            </label>
            <Textarea
              id="resume-text"
              rows={12}
              className="mt-1.5 font-mono text-xs"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your resume here…"
            />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              saveProfile({ ...profile, resumeText: text });
              toast.success("Resume text saved to your profile");
            }}
          >
            Save resume text to profile
          </Button>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="job-heading" className="surface-card p-5">
            <h2 id="job-heading" className="text-xl font-semibold">Choose Target Role</h2>
            <div className="mt-3">
              <label htmlFor="job-select" className="block text-sm font-medium">Role</label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger id="job-select" className="mt-1.5">
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {allJobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title} — {j.company} ({j.workMode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section aria-labelledby="analysis-heading" className="surface-card p-5">
            <h2 id="analysis-heading" className="flex items-center gap-2 text-xl font-semibold">
              <Sparkles aria-hidden="true" className="size-5 text-brand" />
              Ableo Match Analysis
            </h2>
            {!result || !job ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Add your resume text and select a role to see the analysis.
              </p>
            ) : (
              <div aria-live="polite">
                <p className="mt-3 text-3xl font-bold">
                  {result.coverage}%{" "}
                  <span className="text-base font-medium text-muted-foreground">
                    requirement coverage
                  </span>
                </p>
                <Progress value={result.coverage} className="mt-2" aria-label={`Coverage ${result.coverage} percent`} />

                <h3 className="mt-4 text-sm font-semibold">Matched Skills</h3>
                {result.matched.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5 text-sm">
                    {result.matched.map((s) => (
                      <li key={s} className="flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        <Check aria-hidden="true" className="size-3.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    None of the listed skills were found in your resume text.
                  </p>
                )}

                <h3 className="mt-4 text-sm font-semibold">Missing Skills (To Close)</h3>
                {result.missingRequired.length || result.missingPreferred.length ? (
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {[...result.missingRequired, ...result.missingPreferred].map((s) => (
                      <li key={s} className="flex items-center gap-2 text-xs">
                        <AlertTriangle aria-hidden="true" className="size-3.5 text-warning shrink-0" />
                        <span className="font-medium text-foreground">{s}</span>
                        <span className="text-muted-foreground">
                          {result.missingRequired.includes(s) ? "(required)" : "(preferred)"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">All listed skills found in your resume!</p>
                )}

                <h3 className="mt-4 text-sm font-semibold">Experience Match</h3>
                <p className="mt-1 text-sm">
                  {result.experience}% — role asks for {job.experience}
                  {profile.experienceBand ? `, your profile says ${profile.experienceBand}` : ". Add experience level to your profile for accuracy."}
                </p>

                {result.notes.length ? (
                  <>
                    <h3 className="mt-4 text-sm font-semibold">Recommended Improvements</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {result.notes.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  </>
                ) : null}

                <Button className="mt-4 w-full" onClick={() => setShowImprove((v) => !v)} aria-expanded={showImprove}>
                  {showImprove ? "Hide bullet suggestions" : "Suggested Bullet Improvements"}
                </Button>
                {showImprove ? (
                  <div className="mt-3 rounded-md border border-border bg-secondary/50 p-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-brand">Suggested Bullet Points</h3>
                    <ul className="mt-2 list-disc space-y-2 pl-4 text-xs">
                      {result.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                  <Link to="/jobs/$jobId" params={{ jobId: job.id }} className="text-xs font-medium text-brand hover:underline">
                    View Job &amp; Accommodations
                  </Link>
                  <Button asChild size="sm" className="gap-1 bg-brand text-brand-foreground">
                    <Link to="/apply/$jobId" params={{ jobId: job.id }}>
                      Apply with Ableo
                      <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
