import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { JobCard } from "@/components/job-card";
import { JobSearchBar } from "@/components/job-search-bar";
import {
  ACCESS_FEATURES, CITIES, INCLUSION_FEATURES,
} from "@/lib/jobs-data";
import { EMPTY_FILTERS, filterJobs, type Filters } from "@/lib/search";
import { useAppState } from "@/lib/app-state";
import type { QueryChip } from "@/lib/voice-query";

export const Route = createFileRoute("/jobs/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Job Search — AccessPath" },
      {
        name: "description",
        content:
          "Search and filter Indian jobs by work mode, experience, accessibility support and inclusive workplace policies.",
      },
      { property: "og:title", content: "Job Search — AccessPath" },
      {
        property: "og:description",
        content: "Filter jobs by accessibility support and inclusive workplace information.",
      },
    ],
  }),
  component: JobsPage,
});

type Group = { key: keyof Filters; legend: string; options: { value: string; label: string }[] };

const GROUPS: Group[] = [
  {
    key: "workModes",
    legend: "Location & work mode",
    options: [
      { value: "Remote", label: "Remote" },
      { value: "Hybrid", label: "Hybrid" },
      { value: "On-site", label: "On-site" },
    ],
  },
  {
    key: "employment",
    legend: "Employment type",
    options: ["Full-time", "Part-time", "Internship", "Contract"].map((v) => ({ value: v, label: v })),
  },
  {
    key: "experience",
    legend: "Experience",
    options: ["Fresher", "0-2 years", "2-5 years", "5+ years"].map((v) => ({ value: v, label: v })),
  },
  {
    key: "cities",
    legend: "City",
    options: CITIES.map((c) => ({ value: c, label: c })),
  },
  {
    key: "access",
    legend: "Accessibility support",
    options: Object.entries(ACCESS_FEATURES).map(([value, label]) => ({ value, label })),
  },
  {
    key: "inclusion",
    legend: "Inclusive workplace information",
    options: Object.entries(INCLUSION_FEATURES).map(([value, label]) => ({ value, label })),
  },
];

function JobsPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const { allJobs } = useAppState();
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, q });
  const [pending, setPending] = useState<{ filters: Filters; chips: QueryChip[]; heard: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const filterPanel = useRef<HTMLDivElement | null>(null);
  const query = filters.q || q;

  const results = useMemo(() => filterJobs({ ...filters, q: query }, allJobs), [filters, query, allJobs]);
  const activeCount = GROUPS.reduce((n, g) => n + (filters[g.key] as string[]).length, 0);

  const toggle = (key: keyof Filters, value: string) =>
    setFilters((prev) => {
      const list = prev[key] as string[];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });

  const setQuery = (value: string) => {
    setFilters((prev) => ({ ...prev, q: value }));
    navigate({ to: "/jobs", search: { q: value }, replace: true });
  };

  const applyParsed = (next: Filters) => {
    setFilters(next);
    navigate({ to: "/jobs", search: { q: next.q }, replace: true });
  };

  /** Chips reflect every active filter, so removing one re-runs the search. */
  const chips: QueryChip[] = [
    ...(query ? [{ group: "q" as keyof Filters, value: query, label: query }] : []),
    ...GROUPS.flatMap((g) =>
      (filters[g.key] as string[]).map((v) => ({
        group: g.key,
        value: v,
        label: g.options.find((o) => o.value === v)?.label ?? v,
      })),
    ),
  ];

  const removeChip = (chip: QueryChip) => {
    if (chip.group === "q") {
      setQuery("");
      setAnnouncement(`Removed search term ${chip.label}.`);
      return;
    }
    toggle(chip.group, chip.value);
    setAnnouncement(`Removed filter ${chip.label}.`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Find your next opportunity</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Accessibility and inclusion details below are provided by the employer or verified by
        AccessPath.
      </p>

      <div className="mt-6">
        <JobSearchBar
          value={query}
          onChange={setQuery}
          onSubmit={setQuery}
          onVoiceParse={(result) => setPending(result)}
        />
      </div>

      <p aria-live="polite" className="sr-only">{announcement}</p>

      {pending ? (
        <section
          aria-labelledby="voice-understood"
          className="surface-card mt-4 border-brand/40 p-4"
        >
          <h2 id="voice-understood" className="font-semibold">I understood:</h2>
          <p className="mt-1 text-sm text-muted-foreground">You said: “{pending.heard}”</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {pending.chips.length ? (
              pending.chips.map((c) => (
                <li
                  key={`${c.group}-${c.value}`}
                  className="rounded-full border border-border bg-secondary px-3 py-1 text-sm"
                >
                  {c.label}
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">No filters — all jobs.</li>
            )}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                applyParsed(pending.filters);
                setAnnouncement(`Filters applied. ${pending.chips.length} interpreted from your voice search.`);
                setPending(null);
              }}
            >
              Apply filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                applyParsed(pending.filters);
                setPending(null);
                setAnnouncement("Filters applied. You can adjust them in the filter panel.");
                filterPanel.current?.focus();
              }}
            >
              Edit filters
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPending(null);
                setAnnouncement("Voice search cancelled. Your filters are unchanged.");
              }}
            >
              Cancel
            </Button>
          </div>
        </section>
      ) : null}

      {chips.length ? (
        <div className="mt-4">
          <h2 className="text-sm font-semibold">Active filters</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={`${chip.group}-${chip.value}`}>
                <button
                  type="button"
                  onClick={() => removeChip(chip)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  {chip.label}
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside aria-label="Job filters">
          <div className="surface-card p-4" tabIndex={-1} ref={filterPanel}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              {activeCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ ...EMPTY_FILTERS, q: query })}
                >
                  Clear all ({activeCount})
                </Button>
              ) : null}
            </div>
            <div className="mt-2 divide-y divide-border">
              {GROUPS.map((group) => (
                <fieldset key={group.key} className="py-4">
                  <legend className="mb-2 text-sm font-semibold">{group.legend}</legend>
                  <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {group.options.map((opt) => {
                      const id = `${group.key}-${opt.value}`;
                      const checked = (filters[group.key] as string[]).includes(opt.value);
                      return (
                        <li key={id} className="flex items-center gap-2">
                          <Checkbox
                            id={id}
                            checked={checked}
                            onCheckedChange={() => toggle(group.key, opt.value)}
                          />
                          <label htmlFor={id} className="text-sm">
                            {opt.label}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              ))}
            </div>
          </div>
        </aside>

        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-lg font-semibold" aria-live="polite">
            {results.length} {results.length === 1 ? "job" : "jobs"} found
            {query ? ` for “${query}”` : ""}
          </h2>
          {results.length === 0 ? (
            <p className="surface-card mt-4 p-6 text-sm text-muted-foreground">
              No jobs match these filters yet. Try removing a filter or searching a broader term
              such as “developer” or “support”.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4">
              {results.map((job) => (
                <li key={job.id}>
                  <JobCard job={job} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
