import { useState } from "react";
import { Mic, MicOff, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVoiceSearch, normaliseSpokenQuery } from "@/lib/speech";
import { parseVoiceQuery, type QueryChip } from "@/lib/voice-query";
import type { Filters } from "@/lib/search";

export function JobSearchBar({
  value,
  onChange,
  onSubmit,
  onVoiceParse,
  id = "job-search",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: (v: string) => void;
  /** When provided, spoken queries become structured filters instead of plain text. */
  onVoiceParse?: (result: { filters: Filters; chips: QueryChip[]; heard: string }) => void;
  id?: string;
}) {
  const [status, setStatus] = useState("");
  const { supported, listening, start, stop } = useVoiceSearch((text) => {
    if (onVoiceParse) {
      const parsed = parseVoiceQuery(text);
      const labels = parsed.chips.map((c) => c.label).join(", ");
      setStatus(`Heard: ${text}. Searching for ${labels || "all jobs"}.`);
      onChange(parsed.filters.q);
      onVoiceParse({ ...parsed, heard: text });
      return;
    }
    const cleaned = normaliseSpokenQuery(text);
    setStatus(`Heard: ${text}. Searching for ${cleaned}.`);
    onChange(cleaned);
    onSubmit?.(cleaned);
  });

  return (
    <form
      role="search"
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
    >
      <div className="flex-1">
        <label htmlFor={id} className="mb-1 block text-sm font-medium">
          Search by job title, skill, company or location
        </label>
        <div className="flex gap-2">
          <Input
            id={id}
            type="search"
            value={value}
            placeholder="e.g. Data Analyst, React, Chennai"
            onChange={(e) => onChange(e.target.value)}
            className="h-11"
          />
          <Button
            type="button"
            variant={listening ? "default" : "outline"}
            className="h-11 min-w-11"
            aria-pressed={listening}
            aria-label={
              supported
                ? listening
                  ? "Stop voice search"
                  : "Search jobs using your voice"
                : "Voice search is not available in this browser"
            }
            disabled={!supported}
            onClick={() => (listening ? stop() : start())}
          >
            {listening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
          </Button>
        </div>
        {supported ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Try: “Find remote frontend developer jobs with accessible interviews.”
          </p>
        ) : null}
      </div>
      <div className="flex items-end">
        <Button type="submit" className="h-11 w-full sm:w-auto">
          <Search aria-hidden="true" />
          Find jobs
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {listening ? "Listening. Say something like: remote software developer jobs in Chennai." : status}
      </p>
      {!supported ? (
        <p className="text-xs text-muted-foreground sm:sr-only">
          Voice search isn't available in this browser — text search works the same way.
        </p>
      ) : null}
    </form>
  );
}
