import { useState } from "react";
import { Mic, MicOff, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVoiceSearch, normaliseSpokenQuery } from "@/lib/speech";
import { parseVoiceQuery, type QueryChip } from "@/lib/voice-query";
import type { Filters } from "@/lib/search";

export type JobSearchBarProps = {
  value?: string;
  filters?: Filters;
  onChange:
    | ((v: string) => void)
    | ((updater: (prev: Filters) => Filters) => void)
    | ((f: Filters) => void);
  onSubmit?: (v: string) => void;
  /** When provided, spoken queries become structured filters instead of plain text. */
  onVoiceParse?: (result: { filters: Filters; chips: QueryChip[]; heard: string }) => void;
  totalCount?: number;
  id?: string;
};

export function JobSearchBar({
  value,
  filters,
  onChange,
  onSubmit,
  onVoiceParse,
  totalCount,
  id = "job-search",
}: JobSearchBarProps) {
  const [status, setStatus] = useState("");
  const currentQuery = filters ? filters.q : (value ?? "");

  const handleTextChange = (newVal: string) => {
    if (filters) {
      (onChange as (updater: (prev: Filters) => Filters) => void)((prev) => ({
        ...prev,
        q: newVal,
      }));
    } else {
      (onChange as (v: string) => void)(newVal);
    }
  };

  const { supported, listening, start, stop } = useVoiceSearch((text) => {
    const parsed = parseVoiceQuery(text);
    const labels = parsed.chips.map((c: QueryChip) => c.label).join(", ");
    setStatus(`Heard: "${text}". Found filters: ${labels || "keyword search"}.`);

    if (onVoiceParse) {
      handleTextChange(parsed.filters.q);
      onVoiceParse({ ...parsed, heard: text });
      return;
    }

    if (filters) {
      (onChange as (updater: (prev: Filters) => Filters) => void)((prev) => ({
        ...prev,
        ...parsed.filters,
        q: parsed.filters.q || prev.q,
      }));
      return;
    }

    const cleaned = normaliseSpokenQuery(text);
    (onChange as (v: string) => void)(cleaned);
    onSubmit?.(cleaned);
  });

  return (
    <form
      role="search"
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(currentQuery);
      }}
    >
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={id} className="text-xs font-semibold text-foreground">
            Search by role title, skill competency, or metro city
          </label>
          {totalCount !== undefined && (
            <span className="text-xs text-muted-foreground font-medium">
              Showing <strong>{totalCount}</strong> verified opportunities
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id={id}
              type="search"
              value={currentQuery}
              placeholder="e.g. React Developer, Data Analyst, Screen Reader, Bengaluru"
              onChange={(e) => handleTextChange(e.target.value)}
              className="h-11 pl-10 text-xs sm:text-sm bg-background border-border/80 focus-visible:ring-brand"
            />
          </div>
          <Button
            type="button"
            variant={listening ? "default" : "outline"}
            className={`h-11 px-3.5 transition-all ${
              listening ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : ""
            }`}
            aria-pressed={listening}
            aria-label={
              supported
                ? listening
                  ? "Stop speech recognition"
                  : "Search inclusive jobs using voice"
                : "Speech recognition not available in this browser"
            }
            disabled={!supported}
            onClick={() => (listening ? stop() : start())}
          >
            {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          </Button>
        </div>
        {supported && !status ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Tip: Say “Remote frontend developer with flexible hours in Pune” to filter dynamically.
          </p>
        ) : null}
        {status ? (
          <p className="mt-1 text-[11px] text-brand font-medium flex items-center gap-1">
            <Sparkles className="size-3" />
            <span>{status}</span>
          </p>
        ) : null}
      </div>
      <div className="flex items-end">
        <Button
          type="submit"
          className="h-11 w-full sm:w-auto px-6 bg-[#7BD3C2] text-[#141817] hover:bg-[#68c5b3] font-semibold text-xs sm:text-sm"
        >
          <Search className="size-4 mr-1.5" />
          Filter Jobs
        </Button>
      </div>
    </form>
  );
}
