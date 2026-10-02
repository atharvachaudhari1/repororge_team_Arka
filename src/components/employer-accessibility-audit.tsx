import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Copy,
  ExternalLink,
  Award,
  Sparkles,
  Info,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Job, AccessFeature, InclusionFeature } from "@/lib/jobs-data";
import { ACCESS_FEATURES, INCLUSION_FEATURES } from "@/lib/jobs-data";

interface Props {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuditItem = {
  id: string;
  category: "Perceivable" | "Operable" | "Understandable" | "Workplace & Interview";
  wcagCriterion: string;
  title: string;
  description: string;
  status: "verified" | "supported" | "partial" | "not_specified";
  recommendation?: string;
};

export function EmployerAccessibilityAuditModal({ job, open, onOpenChange }: Props) {
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  const hasAccess = (key: AccessFeature) => job.access.includes(key);
  const hasInclusion = (key: InclusionFeature) => job.inclusion.includes(key);

  const auditItems: AuditItem[] = [
    {
      id: "wcag-1",
      category: "Perceivable",
      wcagCriterion: "WCAG 1.1.1 / 1.4.3",
      title: "Screen Reader & Assistive Tech Compatibility",
      description:
        "Application portal and assessments support JAWS, NVDA, VoiceOver, and high-contrast styling.",
      status: hasAccess("screen_reader")
        ? job.accessSource === "Verified by AccessPath"
          ? "verified"
          : "supported"
        : "partial",
      recommendation:
        "Ensure all test assessments provide text alternatives and ARIA-compliant form fields.",
    },
    {
      id: "wcag-2",
      category: "Operable",
      wcagCriterion: "WCAG 2.1.1 / 2.4.7",
      title: "Full Keyboard Navigation (No Mouse Required)",
      description:
        "Candidate can complete entire application and test flows using standard keyboard controls without focus traps.",
      status: hasAccess("keyboard_friendly")
        ? job.accessSource === "Verified by AccessPath"
          ? "verified"
          : "supported"
        : "not_specified",
      recommendation:
        "Verify all modal dialogs trap focus correctly and dismiss cleanly with Escape key.",
    },
    {
      id: "wcag-3",
      category: "Perceivable",
      wcagCriterion: "WCAG 1.2.2 / 1.2.4",
      title: "Interview Real-Time Captions & Video Alternatives",
      description:
        "Interviews hosted on Google Meet / Zoom with automated or live CART captions and chat backups.",
      status: hasAccess("captioned_meetings") ? "verified" : "partial",
      recommendation:
        "Provide pre-meeting tech checks to ensure candidate caption preferences are configured.",
    },
    {
      id: "wcag-4",
      category: "Workplace & Interview",
      wcagCriterion: "RPwD Act 2016 / Section 20",
      title: "Accessible Interview Process & Accommodations Guarantee",
      description:
        "Structured policy offering extra time, alternative formats, and remote options without bias.",
      status: hasAccess("accessible_interview") ? "verified" : "supported",
      recommendation:
        "Send interview format and question themes 24 hours in advance upon candidate request.",
    },
    {
      id: "wcag-5",
      category: "Operable",
      wcagCriterion: "Physical / Built Environment",
      title: "Physical Workplace Accessibility & Transit",
      description:
        "Wheelchair ramps, accessible elevators, and tactile paths for on-site / hybrid office visits.",
      status:
        job.workMode === "Remote"
          ? "verified"
          : hasAccess("accessible_workplace")
            ? "supported"
            : "not_specified",
      recommendation:
        job.workMode === "Remote"
          ? "Fully remote: physical commute barriers eliminated."
          : "Add virtual office tour showing wheelchair access.",
    },
    {
      id: "wcag-6",
      category: "Understandable",
      wcagCriterion: "WCAG 3.3.1 / 3.3.2",
      title: "Accessible Application Forms & Clear Instructions",
      description:
        "No time-limited application barriers; explicit field requirements and error explanations.",
      status: hasAccess("accessible_application") ? "verified" : "supported",
    },
    {
      id: "wcag-7",
      category: "Workplace & Interview",
      wcagCriterion: "Inclusive Employment",
      title: "Equal Opportunity & LGBTQ+ Inclusive Policies",
      description:
        "Formal inclusion policy, preferred name respect, and candidate-controlled privacy.",
      status:
        hasInclusion("equal_opportunity") || hasInclusion("lgbtq_policy")
          ? "verified"
          : "supported",
    },
  ];

  const verifiedCount = auditItems.filter((i) => i.status === "verified").length;
  const supportedCount = auditItems.filter((i) => i.status === "supported").length;
  const score = Math.round(
    ((verifiedCount * 1.0 + supportedCount * 0.7) / auditItems.length) * 100,
  );
  const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : "C";

  const visibleItems =
    selectedFilter === "All"
      ? auditItems
      : auditItems.filter((i) => i.category === selectedFilter || i.status === selectedFilter);

  const copyReport = () => {
    const text = [
      `ACCESSIBILITY AUDIT REPORT: ${job.title} at ${job.company}`,
      `Overall Score: ${score}% (Grade ${grade})`,
      `Verification Source: ${job.accessSource || "Employer Self-Declared"}`,
      `Work Mode: ${job.workMode}`,
      "",
      "--- AUDIT DETAILS ---",
      ...auditItems.map(
        (i) => `[${i.status.toUpperCase()}] ${i.title} (${i.wcagCriterion}): ${i.description}`,
      ),
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Audit report copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ShieldCheck className="size-5 text-brand" />
              Workplace Accessibility Audit
            </DialogTitle>
            <Badge className="bg-brand text-brand-foreground text-sm font-bold gap-1 px-2.5 py-1">
              <Award className="size-3.5" />
              Grade {grade} ({score}%)
            </Badge>
          </div>
          <DialogDescription>
            Independent WCAG 2.2 Level AA &amp; RPwD Act compliance audit for{" "}
            <strong>{job.title}</strong> at <strong>{job.company}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Score & Health Card */}
        <div className="rounded-xl border border-brand/30 bg-brand-soft/30 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-brand">
                Accessibility Health Score
              </span>
              <p className="text-3xl font-extrabold text-foreground mt-0.5">
                {score}
                <span className="text-base font-normal text-muted-foreground"> / 100</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {job.accessSource === "Verified by AccessPath"
                  ? "Independently verified by Ableo Accessibility Review Team."
                  : "Employer self-declared accommodations; audited against WCAG 2.2 AA standards."}
              </p>
            </div>
            <div className="space-y-1.5 min-w-44 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-success flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Verified
                </span>
                <span>{verifiedCount} criteria</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-brand flex items-center gap-1">
                  <Info className="size-3.5" /> Supported
                </span>
                <span>{supportedCount} criteria</span>
              </div>
            </div>
          </div>
          <Progress
            value={score}
            className="mt-3"
            aria-label={`Accessibility score ${score} percent`}
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {["All", "Perceivable", "Operable", "Workplace & Interview"].map((cat) => (
            <Button
              key={cat}
              type="button"
              size="sm"
              variant={selectedFilter === cat ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setSelectedFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Audit Checklist Items */}
        <ul className="space-y-2.5 pt-1" aria-label="Accessibility audit items">
          {visibleItems.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border bg-card p-3 text-xs space-y-1.5 hover:border-brand/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    {item.wcagCriterion} &bull; {item.category}
                  </span>
                  <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                    {item.title}
                  </h4>
                </div>
                <Badge
                  variant={
                    item.status === "verified"
                      ? "default"
                      : item.status === "supported"
                        ? "secondary"
                        : "outline"
                  }
                  className="capitalize text-[11px] shrink-0"
                >
                  {item.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              {item.recommendation && (
                <p className="text-[11px] text-brand/90 font-medium bg-brand-soft/40 rounded px-2 py-1">
                  <strong>Guidance: </strong>
                  {item.recommendation}
                </p>
              )}
            </li>
          ))}
        </ul>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={copyReport}
          >
            <Copy className="size-3.5" />
            Copy Audit Report
          </Button>
          <Button
            type="button"
            size="sm"
            className="text-xs bg-brand text-brand-foreground"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
