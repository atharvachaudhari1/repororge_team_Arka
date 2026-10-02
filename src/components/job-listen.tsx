import { Pause, Play, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTextToSpeech } from "@/lib/speech";
import { jobSpeechScript, jobSpeechSections } from "@/lib/job-speech";
import type { Job } from "@/lib/jobs-data";

export function JobListen({ job }: { job: Job }) {
  const tts = useTextToSpeech();
  const sections = jobSpeechSections(job);

  return (
    <div className="mt-4 rounded-md border border-border bg-secondary/50 p-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Volume2 aria-hidden="true" className="size-4" />
        Listen to this job
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Reads only the job facts, in order: title, company, location, salary, work mode,
        responsibilities, skills, accessibility information and how to apply.
      </p>
      {tts.supported ? (
        <>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="min-h-11"
              onClick={() => tts.play(jobSpeechScript(job))}
              disabled={tts.state === "speaking"}
            >
              <Play aria-hidden="true" />
              {tts.state === "paused" ? "Resume" : "Listen to job"}
            </Button>
            <Button size="sm" variant="outline" className="min-h-11" onClick={tts.pause} disabled={tts.state !== "speaking"}>
              <Pause aria-hidden="true" />
              Pause
            </Button>
            <Button size="sm" variant="outline" className="min-h-11" onClick={tts.stop} disabled={tts.state === "idle"}>
              <Square aria-hidden="true" />
              Stop
            </Button>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium">Listen to one section</summary>
            <ul className="mt-2 flex flex-wrap gap-2">
              {sections.map((s) => (
                <li key={s.heading}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => tts.play(`${s.heading}. ${s.text}`)}
                  >
                    {s.heading}
                  </Button>
                </li>
              ))}
            </ul>
          </details>
          <p aria-live="polite" className="sr-only">Read aloud {tts.state}</p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          Read-aloud isn't available in this browser. The full job text is below and works with your
          screen reader.
        </p>
      )}
    </div>
  );
}
