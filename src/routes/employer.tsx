import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, CheckCircle2, PlusCircle, Users, Zap } from "lucide-react";
import { JOBS } from "@/lib/jobs-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/employer")({
  component: EmployerPage,
});

function EmployerPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-brand uppercase tracking-wider">Inclusive Employer Portal</span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
            Talent &amp; Inclusion Intelligence
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Audit your workplace accommodations and connect with qualified professionals with disabilities.
          </p>
        </div>

        <Button className="bg-[#7BD3C2] text-[#141817] hover:bg-[#68c5b3] font-semibold text-xs gap-1.5">
          <PlusCircle className="size-4" />
          Post Accessible Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Active Job Postings
            </CardTitle>
            <CardDescription className="text-xs">
              Jobs with verified accommodation checklists
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold font-display">{JOBS.length}</span>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="size-4 text-brand" />
              Candidate Applications
            </CardTitle>
            <CardDescription className="text-xs">
              Applicants across all published positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold font-display">14</span>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="size-4 text-amber-500" />
              Inclusion Score
            </CardTitle>
            <CardDescription className="text-xs">
              Based on workplace accessibility audit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold font-display text-brand">92 / 100</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
