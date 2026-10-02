import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calendar,
  CalendarPlus,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchPill } from "@/components/match-insights";
import { AccessibilityFeedbackDialog } from "@/components/accessibility-feedback";
import { APPLICATION_STATUSES, useAppState, type ApplicationStatus, type Application } from "@/lib/app-state";
import { toast } from "sonner";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "My Applications — Ableo" },
      {
        name: "description",
        content:
          "Track your job applications on Ableo: accommodation requests, interview accessibility, status updates, and calendar exports — all designed for People with Disabilities.",
      },
      { property: "og:title", content: "My Applications — Ableo" },
      { property: "og:description", content: "Track applications, accommodation requests, and interview accessibility. Disability-first job tracking." },
    ],
  }),
  component: ApplicationsPage,
});

const TONE: Record<ApplicationStatus, string> = {
  Applied: "secondary",
  "Under Review": "secondary",
  Shortlisted: "default",
  Interview: "default",
  Offer: "default",
  Rejected: "outline",
};

export function downloadIcs(title: string, company: string, dateStr: string) {
  const icsData = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ableo//Accessible Job Interview//EN",
    "BEGIN:VEVENT",
    `SUMMARY:Interview: ${title} at ${company}`,
    `DESCRIPTION:Job interview for ${title} via Ableo with verified accessibility accommodations.`,
    "DTSTART:20261008T093000Z",
    "DTEND:20261008T101500Z",
    "LOCATION:Google Meet (Live Captions Enabled)",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Interview_${company.replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("Calendar invite (.ics) downloaded!");
}

function ApplicationsPage() {
  const { applications, findJob } = useAppState();
  const [filter, setFilter] = useState<"All" | ApplicationStatus>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [emailModalApp, setEmailModalApp] = useState<Application | null>(null);

  const visible = applications.filter((a) => filter === "All" || a.status === filter);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="mt-1 text-muted-foreground" aria-live="polite">
            {applications.length} {applications.length === 1 ? "application" : "applications"} tracked on Ableo.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/jobs" search={{ q: "" }}>
            Explore More Jobs
          </Link>
        </Button>
      </div>

      <div role="group" aria-label="Filter applications by status" className="mt-6 flex flex-wrap gap-2">
        {(["All", ...APPLICATION_STATUSES] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            aria-pressed={filter === s}
            onClick={() => setFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="surface-card mt-6 p-8 text-center">
          <h2 className="font-semibold text-lg">No applications found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {applications.length
              ? "No applications with this status filter."
              : "Apply to a job using Ableo's Accessible Application Assistant and it will appear here."}
          </p>
          <Button asChild className="mt-4">
            <Link to="/jobs" search={{ q: "" }}>Find jobs</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5">
          {visible.map((a) => {
            const job = findJob(a.jobId);
            if (!job) return null;
            const open = openId === a.jobId;
            const isInterview = a.status === "Interview";

            return (
              <li key={a.jobId} className="surface-card p-5 transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">
                      <Link to="/jobs/$jobId" params={{ jobId: job.id }} className="hover:underline">
                        {job.title}
                      </Link>
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      <strong>{job.company}</strong> • {job.city} • Applied {a.date}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={TONE[a.status] as "default" | "secondary" | "outline"} className="font-semibold px-2.5 py-1">
                      {a.status}
                    </Badge>
                    {a.matchScore ? <MatchPill score={a.matchScore} /> : null}
                  </div>
                </div>

                {/* Progress Tracker Stepper */}
                <div className="mt-4 rounded-lg bg-secondary/40 p-3 border border-border/60">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span className={a.status === "Applied" ? "font-bold text-brand" : "text-foreground"}>1. Applied</span>
                    <span>→</span>
                    <span className={a.status === "Under Review" ? "font-bold text-brand" : ""}>2. Under Review</span>
                    <span>→</span>
                    <span className={a.status === "Shortlisted" ? "font-bold text-brand" : ""}>3. Shortlisted</span>
                    <span>→</span>
                    <span className={a.status === "Interview" ? "font-bold text-success flex items-center gap-1" : ""}>
                      {a.status === "Interview" ? <CheckCircle2 className="size-3 text-success" /> : null} 4. Interview
                    </span>
                    <span>→</span>
                    <span className={a.status === "Offer" ? "font-bold text-success" : ""}>5. Offer</span>
                  </div>
                  <p className="mt-2 text-xs text-foreground font-medium flex items-center gap-1.5">
                    <Clock className="size-3.5 text-brand" />
                    <strong>Next step: </strong> {a.nextStep}
                  </p>
                </div>

                {/* Interview & Calendar Integration Section (Slide 4 Feature) */}
                {isInterview ? (
                  <div className="mt-4 rounded-xl border-2 border-brand/30 bg-brand-soft/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand/20 pb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-5 text-brand" />
                        <div>
                          <h3 className="font-bold text-sm text-foreground">Interview Scheduled</h3>
                          <p className="text-xs text-muted-foreground">
                            {a.interviewDate || "Upcoming Session"} • {a.interviewTime || "45 mins"}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-success text-success-foreground text-xs font-semibold gap-1">
                        <ShieldCheck className="size-3.5" />
                        Accommodations Confirmed
                      </Badge>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      <p>
                        <strong>Format: </strong>
                        {a.interviewFormat || "Remote (Google Meet with Live Captions)"}
                      </p>
                      <p>
                        <strong>Platform: </strong>
                        Google Meet (Screen-reader &amp; Caption friendly)
                      </p>
                    </div>

                    {/* Calendar & Email Buttons */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        className="gap-1.5 h-8 text-xs font-medium"
                        onClick={() => downloadIcs(job.title, job.company, a.interviewDate || "2026-10-08")}
                      >
                        <CalendarPlus className="size-3.5" />
                        Add to Calendar (.ics)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-xs font-medium"
                        onClick={() => {
                          const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                            `Interview: ${job.title} at ${job.company}`,
                          )}&details=${encodeURIComponent(
                            `Ableo Interview with confirmed accessibility accommodations: ${a.accommodations.join(", ")}`,
                          )}&location=${encodeURIComponent("Google Meet")}`;
                          window.open(url, "_blank");
                        }}
                      >
                        <ExternalLink className="size-3.5" />
                        Google Calendar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 h-8 text-xs font-medium"
                        onClick={() => setEmailModalApp(a)}
                      >
                        <Mail className="size-3.5 text-brand" />
                        View Email Notification
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* Details Accordion */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : a.jobId)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                    aria-expanded={open}
                  >
                    <span>{open ? "Hide application details" : "View application details"}</span>
                    {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    <AccessibilityFeedbackDialog
                      jobId={a.jobId}
                      company={job.company}
                    />
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                      <Link to="/career-gps">
                        Interview Coach
                      </Link>
                    </Button>
                  </div>
                </div>

                {open ? (
                  <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-4 text-xs space-y-3">
                    <div>
                      <h4 className="font-semibold text-foreground">Requested Accommodations:</h4>
                      {a.accommodations.length ? (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {a.accommodations.map((acc) => (
                            <Badge key={acc} variant="secondary" className="text-[11px] font-normal">
                              ✓ {acc}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-muted-foreground">Standard application without custom accommodations.</p>
                      )}
                    </div>
                    {a.accommodationNote ? (
                      <div>
                        <h4 className="font-semibold text-foreground">Candidate Note:</h4>
                        <p className="mt-0.5 text-muted-foreground">{a.accommodationNote}</p>
                      </div>
                    ) : null}
                    <div>
                      <h4 className="font-semibold text-foreground">Resume Attached:</h4>
                      <p className="mt-0.5 text-muted-foreground">{a.resumeName}</p>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {/* Simulated Email Notification Modal (Slide 4 Feature: Email Service) */}
      {emailModalApp ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="surface-card w-full max-w-lg border-2 border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Mail className="size-5 text-brand" />
                <h3 id="email-modal-title" className="font-bold text-base">
                  Simulated Email Notification
                </h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setEmailModalApp(null)}
              >
                ✕
              </Button>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="rounded-md bg-secondary/50 p-2.5 space-y-1">
                <p><strong>From: </strong> hiring@technova-india.com via Ableo</p>
                <p><strong>To: </strong> {emailModalApp.resumeName ? "candidate@example.com" : "you@example.com"}</p>
                <p><strong>Subject: </strong> {emailModalApp.emailSubject || "Update on your application"}</p>
                <p><strong>Date: </strong> Today, 10:30 AM</p>
              </div>

              <div className="rounded-md border border-border bg-background p-4 text-sm leading-relaxed space-y-3">
                <p>Dear Candidate,</p>
                <p>
                  Thank you for applying through <strong>Ableo</strong>. We are pleased to invite you for an interview!
                </p>
                <div className="rounded-md bg-success/10 border border-success/30 p-2.5 text-xs text-success-foreground">
                  <p className="font-bold">✓ Confirmed Accommodations:</p>
                  <ul className="list-disc pl-4 mt-1">
                    {emailModalApp.accommodations.map((acc) => (
                      <li key={acc}>{acc}</li>
                    ))}
                  </ul>
                </div>
                <p>
                  Meeting Link: <strong>https://meet.google.com/abc-ableo-xyz</strong> (Live Captions &amp; Screen Reader compatible).
                </p>
                <p>Best regards,<br />Talent Acquisition Team</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button onClick={() => setEmailModalApp(null)}>Close Email</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
