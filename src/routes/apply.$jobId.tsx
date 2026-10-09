import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { getJob, ACCESS_FEATURES } from "@/lib/jobs-data";
import { useAppState } from "@/lib/app-state";
import { accessibilityFit } from "@/lib/accessibility";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/apply/$jobId")({
  component: JobApplyPage,
});

function JobApplyPage() {
  const { jobId } = Route.useParams();
  const { profile } = useAppState();
  const job = getJob(jobId);

  const [applicantName, setApplicantName] = useState(profile.displayName || profile.name);
  const [applicantEmail, setApplicantEmail] = useState(profile.email);
  const [coverNote, setCoverNote] = useState("");
  const [selectedAccommodations, setSelectedAccommodations] = useState<string[]>(
    profile.accessibilityPreferences || []
  );
  const [customAccommodationNote, setCustomAccommodationNote] = useState("");
  const [shareAccommodations, setShareAccommodations] = useState(
    profile.shareAccommodationsByDefault
  );
  const [anonymousInitialReview, setAnonymousInitialReview] = useState(
    !profile.shareLegalName
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!job) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Job Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The position you are trying to apply for does not exist or has expired.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/jobs">Back to All Jobs</Link>
        </Button>
      </div>
    );
  }

  const toggleAccommodation = (accKey: string) => {
    setSelectedAccommodations((prev) =>
      prev.includes(accKey) ? prev.filter((k) => k !== accKey) : [...prev, accKey]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate instantaneous local submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 400);
  };

  const fit = accessibilityFit(profile.accessibilityPreferences, job);

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="surface-card rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Application Submitted!
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Your confidential application for <strong>{job.title}</strong> at{" "}
              <strong>{job.company}</strong> has been transmitted safely.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 text-left max-w-lg mx-auto space-y-3 text-xs">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Applicant:</span>
              <span className="font-medium">{applicantName}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Target Role:</span>
              <span className="font-medium">{job.title}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Privacy Mode:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {anonymousInitialReview ? "Anonymous Pre-Screen Active" : "Full Disclosure"}
              </span>
            </div>
            {selectedAccommodations.length > 0 && (
              <div>
                <span className="text-muted-foreground block mb-1">Requested Accommodations:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedAccommodations.map((acc) => (
                    <span
                      key={acc}
                      className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-[10px]"
                    >
                      ✓ {ACCESS_FEATURES[acc as keyof typeof ACCESS_FEATURES] || acc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild className="bg-[#7BD3C2] text-[#141817] hover:bg-[#68c5b3] font-semibold text-xs">
              <Link to="/applications">View in My Applications</Link>
            </Button>
            <Button asChild variant="outline" className="text-xs">
              <Link to="/jobs">Discover More Roles</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      {/* Back to Job link */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground hover:text-foreground">
          <Link to={`/jobs/${job.id}` as any}>
            <ArrowLeft className="size-3.5" />
            Back to Job Details
          </Link>
        </Button>
      </div>

      {/* Role Summary Banner */}
      <div className="surface-card p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3.5" />
                {job.company}
              </span>
              {(job.transparencyLevel === "verified" || job.accessSource === "Verified by AccessPath") && (
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px]">
                  <CheckCircle2 className="size-3 mr-1" />
                  Verified Inclusive
                </Badge>
              )}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Apply for {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="size-3 text-brand" />
                {job.city}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {job.workMode} ({job.employment})
              </span>
            </div>
          </div>

          {fit.fitScore > 0 && (
            <div className="rounded-2xl border border-brand/30 bg-brand/10 p-3.5 text-center shrink-0">
              <div className="text-xs font-semibold text-brand flex items-center justify-center gap-1">
                <Sparkles className="size-3.5" />
                {fit.fitScore}% Accommodations Fit
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {fit.matchedFeatures.length} shared features
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Candidate Information */}
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-base font-bold">1. Candidate Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="applicantName" className="text-xs font-semibold text-foreground">
                  Display / Preferred Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="applicantName"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="applicantEmail" className="text-xs font-semibold text-foreground">
                  Contact Email <span className="text-destructive">*</span>
                </label>
                <Input
                  id="applicantEmail"
                  type="email"
                  required
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="coverNote" className="text-xs font-semibold text-foreground">
                Brief Introduction / Notes for the Inclusive Team
              </label>
              <Textarea
                id="coverNote"
                rows={3}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Highlight your key achievements, portfolio link, or reason for choosing this inclusive role..."
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Accommodation Requests */}
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                2. Workplace Accommodations for the Interview Process
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                Optional &amp; Confidential
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select any adjustments that allow you to present your best self. Employers committed to Ableo pledge fair consideration regardless of accommodation requests.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(ACCESS_FEATURES).map(([key, label]) => {
                const isSelected = selectedAccommodations.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleAccommodation(key)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all text-xs ${
                      isSelected
                        ? "border-brand bg-brand-soft/40 font-medium text-foreground"
                        : "border-border/80 bg-background/50 hover:bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`mt-0.5 size-4 rounded flex items-center justify-center border text-[10px] ${
                        isSelected
                          ? "bg-brand border-brand text-black font-bold"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                    <span className="leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 pt-2">
              <label htmlFor="customAccommodation" className="text-xs font-semibold text-foreground">
                Specific Setup Requirements / Custom Requests
              </label>
              <Input
                id="customAccommodation"
                value={customAccommodationNote}
                onChange={(e) => setCustomAccommodationNote(e.target.value)}
                placeholder="e.g. Ergonomic chair, dark room setup, screen reader JAWS 2024 testing..."
                className="text-xs h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Candidate Privacy Controls */}
        <Card className="surface-card border-brand/20">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="size-4 text-brand" />
              3. Anti-Bias &amp; Privacy Shield
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-secondary/40">
              <input
                type="checkbox"
                checked={anonymousInitialReview}
                onChange={(e) => setAnonymousInitialReview(e.target.checked)}
                className="size-4 rounded accent-brand"
              />
              <span>
                <strong>Blind Initial Screening:</strong> Mask legal name and personal demographic identifiers until interview shortlisting.
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-secondary/40">
              <input
                type="checkbox"
                checked={shareAccommodations}
                onChange={(e) => setShareAccommodations(e.target.checked)}
                className="size-4 rounded accent-brand"
              />
              <span>
                <strong>Share Accommodations with Interview Panel:</strong> Ensure technical interviewers prepare captions or alternative formats prior to calls.
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link to={`/jobs/${job.id}` as any}>Cancel</Link>
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="bg-[#7BD3C2] text-[#141817] hover:bg-[#68c5b3] font-semibold text-sm px-8 gap-2 shadow-sm"
          >
            <Send className="size-4" />
            {isSubmitting ? "Submitting Application..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}
