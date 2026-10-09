import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Filter,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
import { ACCESS_FEATURES, CITIES, INCLUSION_FEATURES, JOBS, type Job } from "@/lib/jobs-data";
import { EMPTY_FILTERS, filterJobs, type Filters } from "@/lib/search";
import { useAppState } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { JobCard } from "@/components/job-card";
import { JobSearchBar } from "@/components/job-search-bar";
import { EmptyState } from "@/components/states";

export const Route = createFileRoute("/jobs/")({
  component: JobsPage,
});

const WORK_MODES = ["Remote", "Hybrid", "On-site"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const EXPERIENCE_LEVELS = ["Fresher", "0-2 years", "2-5 years", "5+ years"];

function JobsPage() {
  const { profile } = useAppState();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter jobs with search core engine
  const filteredJobs = useMemo(() => {
    return filterJobs(filters, JOBS);
  }, [filters]);

  const toggleFilterItem = (category: keyof Filters, value: string) => {
    setFilters((prev) => {
      const arr = prev[category] as string[];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [category]: next };
    });
  };

  const activeFilterCount =
    (filters.q ? 1 : 0) +
    filters.workModes.length +
    filters.cities.length +
    filters.employment.length +
    filters.experience.length +
    filters.access.length +
    filters.inclusion.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Search Header Banner */}
      <div className="rounded-3xl border border-border bg-gradient-to-b from-card to-background p-6 sm:p-10 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand-soft/70 px-3.5 py-1 text-xs font-semibold text-foreground mb-3">
            <Sparkles className="size-3 text-brand" />
            <span>Search Core Engine • {JOBS.length} Inclusive Roles Loaded</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Explore Accessible Jobs
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Filter by verified workplace accommodations, wheelchair accessibility, screen-reader compatibility,
            and transit-friendly locations across Indian metro hubs.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="mt-6">
          <JobSearchBar
            filters={filters}
            onChange={setFilters}
            totalCount={filteredJobs.length}
          />
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex justify-between items-center bg-card p-3 rounded-xl border border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="gap-2 text-xs"
          >
            <Filter className="size-3.5 text-brand" />
            {showMobileFilters ? "Hide Filters" : "Show Accommodation Filters"}
            {activeFilterCount > 0 && (
              <span className="size-4 rounded-full bg-brand text-[#141817] text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-xs text-muted-foreground"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Filters Sidebar */}
        <aside
          aria-label="Job Search Filters"
          className={`${showMobileFilters ? "block" : "hidden lg:block"} space-y-6 lg:sticky lg:top-24 rounded-2xl border border-border bg-card p-5 surface-card`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-brand" />
              Filter By Needs
            </h2>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Work Mode */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Work Mode
            </h3>
            <div className="space-y-2">
              {WORK_MODES.map((mode) => (
                <label
                  key={mode}
                  className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer hover:text-brand transition-colors"
                >
                  <Checkbox
                    checked={filters.workModes.includes(mode)}
                    onCheckedChange={() => toggleFilterItem("workModes", mode)}
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Experience Band */}
          <div className="space-y-2.5 pt-3 border-t border-border/60">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Experience Level
            </h3>
            <div className="space-y-2">
              {EXPERIENCE_LEVELS.map((exp) => (
                <label
                  key={exp}
                  className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer hover:text-brand transition-colors"
                >
                  <Checkbox
                    checked={filters.experience.includes(exp)}
                    onCheckedChange={() => toggleFilterItem("experience", exp)}
                  />
                  <span>{exp}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Primary Accessibility Accommodations */}
          <div className="space-y-2.5 pt-3 border-t border-border/60">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Accommodations</span>
              <span className="text-[10px] text-brand lowercase font-normal">verified</span>
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {Object.entries(ACCESS_FEATURES).map(([key, feat]) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer hover:text-brand transition-colors"
                >
                  <Checkbox
                    checked={filters.access.includes(key)}
                    onCheckedChange={() => toggleFilterItem("access", key)}
                  />
                  <span className="flex items-center gap-1.5 truncate">
                    <span aria-hidden="true">✓</span>
                    <span className="truncate">{feat}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Indian Cities / Hubs */}
          <div className="space-y-2.5 pt-3 border-t border-border/60">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Metro City Hub
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {CITIES.map((city) => (
                <label
                  key={city}
                  className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer hover:text-brand transition-colors"
                >
                  <Checkbox
                    checked={filters.cities.includes(city)}
                    onCheckedChange={() => toggleFilterItem("cities", city)}
                  />
                  <span>{city}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <main className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-xs text-muted-foreground font-medium">
              Showing <strong className="text-foreground">{filteredJobs.length}</strong> of {JOBS.length} inclusive positions
            </span>

            {profile?.accessibilityPreferences?.length > 0 && (
              <Badge variant="outline" className="text-[11px] gap-1 text-brand border-brand/40">
                <Sparkles className="size-3" />
                Accommodation Match Sorting Active
              </Badge>
            )}
          </div>

          {filteredJobs.length === 0 ? (
            <EmptyState
              title="No jobs match your selected filters"
              body="Try loosening your search query or unchecking some of the accommodation filters to view more opportunities."
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-xs"
              >
                Reset All Filters
              </Button>
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
