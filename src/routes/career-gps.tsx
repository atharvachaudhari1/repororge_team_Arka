import { createFileRoute } from "@tanstack/react-router";
import { Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/career-gps")({
  component: CareerGpsPage,
});

function CareerGpsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      <div className="surface-card p-8 rounded-3xl text-center space-y-3">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand/20 text-brand mb-2">
          <Compass className="size-6" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">
          Career GPS &amp; AI Pathways
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          AI-powered personalized career discovery, skill gap analysis, and mock interview coaching will be fully activated in Phase 6.
        </p>
      </div>
    </div>
  );
}
