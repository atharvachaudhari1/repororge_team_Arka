import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/applications")({
  component: ApplicationsPage,
});

const DEMO_APPLICATIONS = [
  {
    id: "app-1",
    jobTitle: "Senior Accessibility Engineer",
    company: "TechInclusive India",
    city: "Bengaluru (Hybrid)",
    appliedDate: "Yesterday",
    status: "Under Review",
    statusColor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-400/40",
    accommodationsRequested: ["Screen reader testing environment", "Flexible hours"],
  },
  {
    id: "app-2",
    jobTitle: "Front-End Developer (UI / React)",
    company: "EnableCorp Solutions",
    city: "Remote (India)",
    appliedDate: "3 days ago",
    status: "Shortlisted",
    statusColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-400/40",
    accommodationsRequested: ["Real-time captions for video interviews", "Written technical task"],
  },
];

function ApplicationsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          My Applications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track interview stages, accommodation confirmations, and status updates from inclusive employers.
        </p>
      </div>

      <div className="space-y-4">
        {DEMO_APPLICATIONS.map((app) => (
          <Card key={app.id} className="surface-card">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">{app.company}</span>
                  <Badge variant="outline" className={`text-[10px] font-semibold ${app.statusColor}`}>
                    {app.status}
                  </Badge>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{app.jobTitle}</h3>
                <span className="text-xs text-muted-foreground block">{app.city} • Applied {app.appliedDate}</span>

                <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-muted-foreground">Accommodations requested:</span>
                  {app.accommodationsRequested.map((acc) => (
                    <span key={acc} className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-[10px] text-foreground">
                      ✓ {acc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex sm:flex-col gap-2">
                <Button asChild variant="outline" size="sm" className="text-xs">
                  <Link to="/jobs">View Job</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
