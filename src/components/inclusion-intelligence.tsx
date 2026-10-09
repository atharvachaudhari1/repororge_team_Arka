import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  BarChart3,
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTION_STATUS_LABEL,
  useAppState,
  type ActionItem,
  type ActionStatus,
} from "@/lib/app-state";
import { ACCESS_FEATURES, type AccessFeature } from "@/lib/jobs-data";
import { MIN_RESPONSES, employerInsights } from "@/lib/insights";
import { generateInclusionInsight } from "@/lib/ai.functions";
import { StarsReadOnly } from "./accessibility-feedback";

/* ------------------------------------------------------------------ */
/*  Deterministic fallback insight (never fabricates AI output)        */
/* ------------------------------------------------------------------ */

type Aggregate = {
  responses: number;
  demo: boolean;
  categories: { label: string; average: number; count: number }[];
  commonBarriers: { label: string; count: number }[];
};

const BARRIER_ACTIONS: Record<string, string> = {
  "Screen-reader issue": "Audit and fix screen-reader support",
  "Keyboard accessibility issue": "Improve keyboard accessibility",
  "Captioning issue": "Add interview captions",
  "Inaccessible assessment": "Clarify assessment accessibility",
  "Missing accessibility information": "Publish complete accessibility information",
  "Communication barrier": "Offer alternative communication methods",
};

function fallbackInsight(a: Aggregate): {
  summary: string[];
  recommendedAction: string;
} {
  const rated = a.categories.filter((c) => c.count > 0);
  const avg = rated.length ? rated.reduce((n, c) => n + c.average, 0) / rated.length : 0;
  const lowest = [...rated].sort((x, y) => x.average - y.average)[0];
  const topBarrier = [...a.commonBarriers].sort((x, y) => y.count - x.count)[0];

  const summary = [
    `${a.responses} candidate ${a.responses === 1 ? "response" : "responses"} recorded${
      a.demo ? " (demo feedback)" : ""
    }.`,
    rated.length
      ? `Overall experience is ${
          avg >= 3.5 ? "generally positive" : "mixed"
        }, averaging ${avg.toFixed(1)} of 5 across categories.`
      : "",
    lowest
      ? `The lowest-rated area is ${lowest.label.toLowerCase()} at ${lowest.average.toFixed(1)} of 5.`
      : "",
    topBarrier ? `The most common improvement request was: ${topBarrier.label.toLowerCase()}.` : "",
  ].filter(Boolean);

  return {
    summary,
    recommendedAction: topBarrier
      ? (BARRIER_ACTIONS[topBarrier.label] ?? "Review reported barriers and publish what you fix")
      : lowest
        ? `Focus on improving ${lowest.label.toLowerCase()} first`
        : "Keep collecting candidate feedback after each hiring stage",
  };
}

/** Recommended employer actions derived only from real aggregate signals. */
function recommendedActions(
  categories: { key: string; label: string; average: number; count: number }[],
  commonBarriers: { label: string; count: number }[],
): string[] {
  const actions: string[] = [];
  const low = categories.filter((c) => c.count > 0 && c.average < 4);
  const order = ["interview", "assessment", "application", "communication"];
  for (const key of order) {
    const c = low.find((x) => x.key === key);
    if (!c) continue;
    actions.push(
      key === "interview"
        ? "Add interview captions"
        : key === "assessment"
          ? "Clarify assessment accessibility"
          : key === "application"
            ? "Improve keyboard accessibility"
            : "Simplify application communication",
    );
  }
  for (const b of [...commonBarriers].sort((x, y) => y.count - x.count)) {
    const mapped = BARRIER_ACTIONS[b.label];
    if (mapped && !actions.includes(mapped)) actions.push(mapped);
  }
  // Baseline items every employer should provide.
  for (const base of ["Publish accessibility contact", "Document preferred-name support"]) {
    if (!actions.includes(base)) actions.push(base);
  }
  return actions.slice(0, 5);
}

const NEXT_STATUS: Record<ActionStatus, ActionStatus> = {
  not_started: "in_progress",
  in_progress: "completed",
  completed: "not_started",
};

const STATUS_ICON: Record<ActionStatus, typeof Circle> = {
  not_started: Circle,
  in_progress: Loader2,
  completed: CheckCircle2,
};

const STATUS_STYLE: Record<ActionStatus, string> = {
  not_started: "text-muted-foreground border-border bg-background",
  in_progress: "text-brand border-brand/40 bg-brand/10",
  completed: "text-success border-success/40 bg-success/10",
};

/* ------------------------------------------------------------------ */
/*  Main section                                                       */
/* ------------------------------------------------------------------ */

export function InclusionIntelligence() {
  const {
    employerJobs,
    feedback,
    actionPlans,
    setActionItems,
    setActionStatus,
    accessUpdates,
    updateJobAccess,
    allJobs,
  } = useAppState();

  // Companies this employer can look at: their own posted companies plus any
  // company that already has feedback on the platform.
  const companies = useMemo(() => {
    const set = new Set<string>();
    employerJobs.forEach((j) => set.add(j.company));
    feedback.forEach((f) => set.add(f.company));
    return Array.from(set).sort();
  }, [employerJobs, feedback]);

  const [company, setCompany] = useState("");
  const selected = company || companies[0] || "";

  const insights = useMemo(
    () => (selected ? employerInsights(selected, feedback) : null),
    [selected, feedback],
  );

  const barrierCounts = useMemo(() => {
    const mine = feedback.filter((f) => f.company === selected);
    const counts = new Map<string, number>();
    for (const f of mine) for (const b of f.barriers) counts.set(b, (counts.get(b) ?? 0) + 1);
    return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
  }, [feedback, selected]);

  /* ---------------- AI insight ---------------- */
  const genInsight = useServerFn(generateInclusionInsight);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [insight, setInsight] = useState<{
    summary: string[];
    recommendedAction: string;
    aiUsed: boolean;
  } | null>(null);

  const runInsight = async () => {
    if (!insights?.enough || !selected) return;
    setInsightLoading(true);
    setInsightError(null);
    const aggregate: Aggregate = {
      responses: insights.responses,
      demo: insights.demo,
      categories: insights.rows.map((r) => ({
        label: r.label,
        average: r.average,
        count: r.count,
      })),
      commonBarriers: barrierCounts,
    };
    try {
      const res = await genInsight({ data: { company: selected, ...aggregate } });
      if (res.ok) {
        setInsight({
          summary: res.summary,
          recommendedAction: res.recommendedAction,
          aiUsed: true,
        });
      } else {
        setInsight({ ...fallbackInsight(aggregate), aiUsed: false });
        setInsightError(res.error);
      }
    } catch {
      setInsight({
        ...fallbackInsight(aggregate),
        aiUsed: false,
      });
      setInsightError("AI insights are temporarily unavailable. Showing the standard summary.");
    } finally {
      setInsightLoading(false);
    }
  };

  /* ---------------- Action plan ---------------- */
  const plan: ActionItem[] = useMemo(() => {
    if (!insights?.enough || !selected) return [];
    const stored = actionPlans[selected];
    if (stored?.length) return stored;
    // Preview recommendations without writing them until the employer saves.
    return recommendedActions(insights.rows, barrierCounts).map((label, i) => ({
      id: `action-${i + 1}`,
      label,
      status: "not_started" as ActionStatus,
    }));
  }, [insights, selected, actionPlans, barrierCounts]);

  const seedPlan = () => {
    if (!selected || !plan.length) return;
    setActionItems(selected, plan);
    toast.success("Improvement plan saved");
  };

  /* ---------------- Transparency update ---------------- */
  const [updateJobId, setUpdateJobId] = useState("");
  const myJobs = employerJobs;
  const jobForUpdate = myJobs.find((j) => j.id === (updateJobId || myJobs[0]?.id));
  const missingFeatures = jobForUpdate
    ? (Object.keys(ACCESS_FEATURES) as AccessFeature[]).filter(
        (k) => !jobForUpdate.access.includes(k),
      )
    : [];
  const [chosenUpdates, setChosenUpdates] = useState<AccessFeature[]>([]);

  if (companies.length === 0) {
    return (
      <section aria-labelledby="ii-heading" className="surface-card p-5">
        <h2 id="ii-heading" className="flex items-center gap-2 text-2xl font-bold">
          <BarChart3 aria-hidden="true" className="size-6 text-brand" />
          Inclusion Intelligence
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Post a role to start receiving aggregated, anonymous accessibility feedback from
          candidates. You will see category ratings here once enough responses arrive.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="ii-heading" className="space-y-6">
      <div className="surface-card p-5">
        <h2 id="ii-heading" className="flex items-center gap-2 text-2xl font-bold">
          <BarChart3 aria-hidden="true" className="size-6 text-brand" />
          Inclusion Intelligence
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A continuous improvement loop: candidates share experiences anonymously, you act on the
          themes, and future candidates benefit. Only aggregated ratings are ever shown — never an
          individual submission, name or identity.
        </p>

        <div className="mt-4 max-w-sm">
          <label htmlFor="ii-company" className="block text-sm font-medium">
            Company
          </label>
          <Select
            value={selected}
            onValueChange={(v) => {
              setCompany(v);
              setInsight(null);
              setInsightError(null);
            }}
          >
            <SelectTrigger id="ii-company" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!insights || !insights.enough ? (
          <p className="mt-4 rounded-md border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
            Not enough feedback yet.
            {insights
              ? ` ${insights.responses} of ${MIN_RESPONSES} responses needed before any rating is shown.`
              : ""}
          </p>
        ) : (
          <>
            <h3 className="mt-5 text-base font-semibold">Aggregated candidate experience</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {insights.rows.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <dt className="text-sm">{row.label}</dt>
                  <dd>
                    <StarsReadOnly value={row.average} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">
              Based on {insights.responses} responses
              {insights.demo ? " — clearly-labelled demo data." : "."} Individual submissions are
              never shown.
            </p>

            {/* ---- AI accessibility insights ---- */}
            <div className="mt-5 rounded-md border border-border bg-secondary/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles aria-hidden="true" className="size-4 text-brand" />
                  AI accessibility insights
                </h3>
                <Button
                  onClick={runInsight}
                  disabled={insightLoading}
                  size="sm"
                  className="min-h-11"
                >
                  {insightLoading ? (
                    <>
                      <Loader2 aria-hidden="true" className="animate-spin" />
                      Summarising…
                    </>
                  ) : (
                    <>
                      <Sparkles aria-hidden="true" />
                      {insight ? "Regenerate insight" : "Generate insight"}
                    </>
                  )}
                </Button>
              </div>

              {insightError ? (
                <p role="status" className="mt-2 text-xs font-medium text-warning">
                  {insightError}
                </p>
              ) : null}

              {insight ? (
                <div aria-live="polite" className="mt-3">
                  <ul className="space-y-1.5 text-sm">
                    {insight.summary.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  <h4 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Recommended action
                  </h4>
                  <p className="mt-1 rounded-md border border-border bg-background p-3 text-sm font-medium">
                    {insight.recommendedAction}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {insight.aiUsed
                      ? "Generated by AI from aggregated ratings and barrier counts only — never individual feedback or identity data."
                      : "Standard summary built directly from your aggregated feedback."}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Generate an AI summary of your aggregated ratings and recurring accessibility
                  themes.
                </p>
              )}
            </div>

            {/* ---- Employer action plan ---- */}
            <div className="mt-5 rounded-md border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <ClipboardList aria-hidden="true" className="size-4 text-brand" />
                  Improve Accessibility
                </h3>
                {!actionPlans[selected]?.length ? (
                  <Button onClick={seedPlan} variant="outline" size="sm" className="min-h-11">
                    Save this plan
                  </Button>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Recommended from your feedback themes. Select an action to change its status: Not
                Started → In Progress → Completed.
              </p>
              {plan.length ? (
                <ul className="mt-3 space-y-2">
                  {plan.map((item) => {
                    const Icon = STATUS_ICON[item.status];
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!actionPlans[selected]?.length) {
                              setActionItems(
                                selected,
                                plan.map((p) =>
                                  p.id === item.id ? { ...p, status: NEXT_STATUS[p.status] } : p,
                                ),
                              );
                            } else {
                              setActionStatus(selected, item.id, NEXT_STATUS[item.status]);
                            }
                          }}
                          className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${STATUS_STYLE[item.status]}`}
                          aria-label={`${item.label}. Status: ${ACTION_STATUS_LABEL[item.status]}. Activate to change status.`}
                        >
                          <span className="flex items-center gap-2 text-sm font-medium">
                            <Icon aria-hidden="true" className="size-4 shrink-0" />
                            {item.label}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {ACTION_STATUS_LABEL[item.status]}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* ---- Transparency update ---- */}
      <section aria-labelledby="tu-heading" className="surface-card p-5">
        <h2 id="tu-heading" className="flex items-center gap-2 text-xl font-semibold">
          <ShieldCheck aria-hidden="true" className="size-5 text-brand" />
          Update accessibility information
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Improve a listing based on what you have put in place. Updates appear to candidates as{" "}
          <strong>Employer Provided</strong>. Verification by AccessPath is separate and is never
          granted automatically.
        </p>

        {myJobs.length === 0 ? (
          <p className="mt-3 rounded-md border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
            Post a job first — then you can update its accessibility information here.
          </p>
        ) : (
          <>
            <div className="mt-4 max-w-md">
              <label htmlFor="tu-job" className="block text-sm font-medium">
                Your listing
              </label>
              <Select
                value={jobForUpdate?.id ?? ""}
                onValueChange={(v) => {
                  setUpdateJobId(v);
                  setChosenUpdates([]);
                }}
              >
                <SelectTrigger id="tu-job" className="mt-1.5">
                  <SelectValue placeholder="Choose a listing" />
                </SelectTrigger>
                <SelectContent>
                  {myJobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title} — {j.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {jobForUpdate ? (
              <>
                <fieldset className="mt-4">
                  <legend className="text-sm font-medium">
                    Accessibility support now provided
                  </legend>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {(Object.entries(ACCESS_FEATURES) as [AccessFeature, string][]).map(
                      ([k, label]) => {
                        const id = `tu-${k}`;
                        const already = jobForUpdate.access.includes(k);
                        return (
                          <li key={k} className="flex items-center gap-2">
                            <Checkbox
                              id={id}
                              disabled={already}
                              checked={already || chosenUpdates.includes(k)}
                              onCheckedChange={() =>
                                setChosenUpdates((prev) =>
                                  prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
                                )
                              }
                            />
                            <label
                              htmlFor={id}
                              className={`text-sm ${already ? "text-muted-foreground" : ""}`}
                            >
                              {label}
                              {already ? " (already listed)" : ""}
                            </label>
                          </li>
                        );
                      },
                    )}
                  </ul>
                </fieldset>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    className="min-h-11"
                    disabled={chosenUpdates.length === 0}
                    onClick={() => {
                      if (!jobForUpdate) return;
                      updateJobAccess(jobForUpdate.id, chosenUpdates);
                      toast.success("Listing updated for future candidates");
                      setChosenUpdates([]);
                    }}
                  >
                    Publish update
                  </Button>
                  {accessUpdates[jobForUpdate.id]?.length ? (
                    <Badge variant="secondary" className="font-normal">
                      Updated listing — shown as Employer Provided
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Candidates viewing “{jobForUpdate.title}” will immediately see the new information
                  labelled “Accessibility information updated”.
                </p>
              </>
            ) : null}
          </>
        )}
      </section>

      <PlatformImpact />
    </section>
  );
}

/**
 * Small platform impact block using ONLY real on-device data or clearly
 * labelled demo values. No invented outcomes.
 */
function PlatformImpact() {
  const { feedback, allJobs, accessUpdates } = useAppState();

  const statedFeatures = allJobs.reduce((n, j) => n + j.access.length, 0);
  const companiesWithFeedback = new Set(feedback.map((f) => f.company)).size;
  const enoughCount = Array.from(new Set(feedback.map((f) => f.company))).filter(
    (c) => employerInsights(c, feedback).enough,
  ).length;

  const stats: { label: string; value: string }[] = [
    { label: "Listings publishing accessibility details", value: String(allJobs.length) },
    { label: "Accessibility features stated by employers", value: String(statedFeatures) },
    { label: "Anonymous feedback submissions", value: String(feedback.length) },
    {
      label: "Employers with enough feedback for public ratings",
      value: `${enoughCount}${companiesWithFeedback ? "" : ""}`,
    },
    {
      label: "Post-publication accessibility updates",
      value: String(Object.keys(accessUpdates).length),
    },
  ];

  return (
    <section aria-labelledby="impact-heading" className="surface-card p-5">
      <h2 id="impact-heading" className="text-xl font-semibold">
        Platform impact
      </h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md border border-border p-3">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 text-2xl font-bold">{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        Counts reflect activity on this device only. Demo data: aggregated ratings for three
        employers elsewhere on AccessPath are clearly-labelled demo feedback used to illustrate the
        loop.
      </p>
    </section>
  );
}
