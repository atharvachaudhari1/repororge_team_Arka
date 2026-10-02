import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  FEEDBACK_BARRIERS, FEEDBACK_CATEGORIES, useAppState,
  type FeedbackCategory,
} from "@/lib/app-state";

const SCALE = [1, 2, 3, 4, 5];
const WORDS = ["", "Not accessible", "Poor", "Workable", "Good", "Fully accessible"];

function StarRating({
  name, legend, value, onChange,
}: { name: string; legend: string; value: number; onChange: (v: number) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {SCALE.map((v) => {
          const id = `${name}-${v}`;
          const active = value >= v;
          return (
            <span key={id} className="relative">
              <input
                type="radio"
                id={id}
                name={name}
                value={v}
                checked={value === v}
                onChange={() => onChange(v)}
                className="peer absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <label
                htmlFor={id}
                className="flex size-11 items-center justify-center rounded-md border border-transparent peer-focus-visible:border-ring peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
              >
                <Star
                  aria-hidden="true"
                  className={active ? "size-6 fill-brand text-brand" : "size-6 text-muted-foreground"}
                />
                <span className="sr-only">
                  {v} out of 5 — {WORDS[v]}
                </span>
              </label>
            </span>
          );
        })}
        <span className="ml-2 text-sm text-muted-foreground">
          {value ? `${value} of 5 — ${WORDS[value]}` : "Not rated"}
        </span>
      </div>
    </fieldset>
  );
}

/**
 * Post-application accessibility feedback. Anonymous by default; only
 * aggregated ratings ever appear on an employer profile.
 */
export function AccessibilityFeedbackDialog({
  jobId, company,
}: { jobId: string; company: string }) {
  const { addFeedback, hasFeedback } = useAppState();
  const [open, setOpen] = useState(false);
  const [ratings, setRatings] = useState<Partial<Record<FeedbackCategory, number>>>({});
  const [barriers, setBarriers] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [done, setDone] = useState(false);

  const already = hasFeedback(jobId);

  const toggleBarrier = (b: string) =>
    setBarriers((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  const reset = () => {
    setRatings({});
    setBarriers([]);
    setNote("");
    setAnonymous(true);
    setDone(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {already ? "Share more accessibility experience" : "Share accessibility experience"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Accessibility experience — {company}</DialogTitle>
          <DialogDescription>
            Your feedback helps future candidates know what to expect. Only aggregated ratings are
            ever shown on an employer profile.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div aria-live="polite" className="space-y-2">
            <h3 className="text-lg font-semibold">Thank you for helping improve accessible hiring.</h3>
            <p className="text-sm text-muted-foreground">
              {anonymous
                ? "Your feedback has been recorded anonymously."
                : "Your feedback has been recorded and linked to your application for follow-up."}
            </p>
            <Button className="mt-2" onClick={() => setOpen(false)}>Close</Button>
          </div>
        ) : (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              addFeedback({ jobId, company, ratings, barriers, note, anonymous });
              setDone(true);
              toast.success("Accessibility feedback recorded");
            }}
          >
            <section aria-labelledby="fb-step1" className="space-y-4">
              <h3 id="fb-step1" className="font-semibold">
                How accessible was your application experience?
              </h3>
              {FEEDBACK_CATEGORIES.map((c) => (
                <StarRating
                  key={c.key}
                  name={`rating-${c.key}`}
                  legend={c.label}
                  value={ratings[c.key] ?? 0}
                  onChange={(v) => setRatings((prev) => ({ ...prev, [c.key]: v }))}
                />
              ))}
            </section>

            <fieldset>
              <legend className="font-semibold">Did you experience any accessibility barriers?</legend>
              <p className="mt-1 text-sm text-muted-foreground">Select all that apply. Optional.</p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {FEEDBACK_BARRIERS.map((b) => {
                  const id = `barrier-${b.replace(/\s+/g, "-").toLowerCase()}`;
                  return (
                    <li key={b} className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={barriers.includes(b)}
                        onCheckedChange={() => toggleBarrier(b)}
                      />
                      <label htmlFor={id} className="text-sm">{b}</label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            <div>
              <label htmlFor="fb-note" className="block text-sm font-medium">
                Tell us more about your experience (optional)
              </label>
              <Textarea
                id="fb-note"
                rows={4}
                className="mt-1.5"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex items-start gap-3 rounded-md border border-border bg-secondary/50 p-3">
              <Switch id="fb-anon" checked={anonymous} onCheckedChange={setAnonymous} />
              <label htmlFor="fb-anon" className="text-sm">
                Submit anonymously
                <span className="block text-muted-foreground">
                  On by default. Your identity will not be shown to other candidates, and no name is
                  stored with this feedback.
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit">Submit feedback</Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Read-only aggregated star row used on employer profiles. */
export function StarsReadOnly({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="flex items-center gap-1">
      <span aria-hidden="true" className="flex">
        {SCALE.map((v) => (
          <Star
            key={v}
            className={rounded >= v ? "size-4 fill-brand text-brand" : "size-4 text-muted-foreground"}
          />
        ))}
      </span>
      <span className="text-sm font-medium">{value.toFixed(1)} of 5</span>
    </span>
  );
}