import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, ClipboardCopy, AlertTriangle, Sparkles, ListChecks } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BlockSkeleton, ErrorState } from "@/components/states";
import {
  buildBriefing,
  briefingPrompt,
  fallbackAdvice,
  suggestedQuestions,
} from "@/lib/before-you-apply";
import { generateApplyBriefing } from "@/lib/ai.functions";
import type { Job } from "@/lib/jobs-data";
import type { Profile } from "@/lib/app-state";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Chips({ items, tone = "default" }: { items: string[]; tone?: "default" | "warn" }) {
  if (!items.length) return <p className="mt-1 text-sm text-muted-foreground">None recorded.</p>;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {items.map((i) => (
        <li
          key={i}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            tone === "warn" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
          }`}
        >
          {i}
        </li>
      ))}
    </ul>
  );
}

export function BeforeYouApply({
  job,
  profile,
  triggerLabel = "Before you apply",
}: {
  job: Job;
  profile: Profile;
  /** Optional label for the trigger button (e.g. "Ask Employer"). */
  triggerLabel?: string;
}) {
  const brief = buildBriefing(profile, job);
  const generate = useServerFn(generateApplyBriefing);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string[] | null>(null);
  const [question, setQuestion] = useState(brief.suggestedQuestion);
  const [error, setError] = useState<string | null>(null);
  const [aiUsed, setAiUsed] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generate({ data: { brief: briefingPrompt(brief) } });
      if (res.ok) {
        setAdvice(res.advice);
        if (res.question) setQuestion(res.question);
        setAiUsed(true);
      } else {
        const fb = fallbackAdvice(brief);
        setAdvice(fb.advice);
        setQuestion(fb.question);
        setAiUsed(false);
        setError(res.error);
      }
    } catch {
      const fb = fallbackAdvice(brief);
      setAdvice(fb.advice);
      setQuestion(fb.question);
      setError("We couldn't load the AI summary. Showing the standard summary instead.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(question);
      toast.success("Question copied to clipboard");
    } catch {
      toast.error("Copy failed — you can select the text and copy it manually.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && !advice && !loading) void run();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11">
          <ListChecks aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Before you apply: {job.title}</DialogTitle>
          <DialogDescription>
            A preparation summary built from this listing and your profile, so you can decide with
            full information.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-lg border border-success/30 bg-success/5 p-4">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-success">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            You're a strong match
          </h3>
          <ul className="mt-2 space-y-1.5">
            {brief.matched.map((m) => (
              <li key={m} className="flex items-center gap-2 text-sm">
                <span className="text-success" aria-hidden="true">
                  ✓
                </span>
                {m}
              </li>
            ))}
            {brief.accessibilityProvided.length > 0 && (
              <li className="flex items-center gap-2 text-sm">
                <span className="text-success" aria-hidden="true">
                  ✓
                </span>
                {brief.workArrangement.split(" • ")[0]} matches your preference
              </li>
            )}
          </ul>
        </div>

        {brief.missingInformation.length > 0 || brief.mayNeed.length > 0 ? (
          <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-warning">
              <AlertTriangle aria-hidden="true" className="size-4" />
              Check before applying
            </h3>
            <ul className="mt-2 space-y-1.5">
              {brief.missingInformation.map((m) => (
                <li key={m} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true">⚠</span>
                  {m.replace(": not provided by the employer.", " is not specified")}
                </li>
              ))}
              {brief.mayNeed.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true">⚠</span>
                  {s} — required skill to prepare for
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Section title="AI preparation summary">
          {loading ? (
            <div className="mt-2">
              <BlockSkeleton lines={4} label="Generating your preparation summary" />
            </div>
          ) : error ? (
            <ErrorState title="AI summary unavailable" message={error} onRetry={() => void run()} />
          ) : null}
          {advice && !loading ? (
            <ul aria-live="polite" className="mt-2 space-y-2 text-sm">
              {advice.map((a) => (
                <li key={a} className="flex items-start gap-2">
                  <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
                  {a}
                </li>
              ))}
            </ul>
          ) : null}
          {advice && aiUsed ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Generated by AI from this listing and your skills only. No identity, disability or
              accommodation information is sent.
            </p>
          ) : null}
        </Section>

        <Section title="Ask the Employer">
          <p className="text-xs text-muted-foreground">
            Based on accessibility information this employer has not provided. Copy any question and
            send it to the employer before you decide.
          </p>
          <ul className="mt-2 space-y-2">
            {suggestedQuestions(job).map((q) => (
              <li
                key={q}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border bg-secondary/50 p-3"
              >
                <p className="min-w-0 flex-1 text-sm">{q}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-9"
                  aria-label={`Copy question: ${q}`}
                  onClick={() => {
                    navigator.clipboard
                      .writeText(q)
                      .then(() => toast.success("Question copied to clipboard"))
                      .catch(() =>
                        toast.error("Copy failed — you can select the text and copy it manually."),
                      );
                  }}
                >
                  <ClipboardCopy aria-hidden="true" />
                  Copy Question
                </Button>
              </li>
            ))}
          </ul>
        </Section>
      </DialogContent>
    </Dialog>
  );
}
