import { useState } from "react";
import {
  Download,
  Printer,
  Copy,
  FileCheck,
  ShieldCheck,
  Eye,
  Check,
  Sparkles,
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/lib/app-state";
import { prefLabels } from "@/lib/accessibility";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccessibleResumeExportModal({ open, onOpenChange }: Props) {
  const { profile } = useAppState();
  const [includeAccommodations, setIncludeAccommodations] = useState(
    profile.shareAccommodationsByDefault || profile.shareAccessibilityWithEmployers
  );
  const [copied, setCopied] = useState(false);

  const accommodationsList = prefLabels(profile.accessibilityPreferences);
  const candidateName = profile.displayName || profile.name || "Candidate";

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      candidateName,
      profile.headline,
      profile.email ? `Email: ${profile.email}` : "",
      profile.preferredLocation ? `Location: ${profile.preferredLocation}` : "",
      profile.workPreference ? `Work Preference: ${profile.workPreference}` : "",
      "",
      "--- SKILLS ---",
      profile.skills.join(", "),
      "",
      "--- EXPERIENCE ---",
      profile.experience || "Not provided",
      "",
      "--- EDUCATION ---",
      profile.education || "Not provided",
      profile.certifications ? `\n--- CERTIFICATIONS ---\n${profile.certifications}` : "",
    ];

    if (includeAccommodations && accommodationsList.length > 0) {
      lines.push(
        "",
        "--- WORKPLACE ACCOMMODATIONS & ACCESS NEEDS ---",
        accommodationsList.join(", ")
      );
    }

    navigator.clipboard.writeText(lines.filter(Boolean).join("\n"));
    setCopied(true);
    toast.success("Resume text copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${candidateName} — Resume</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
    }
    h1 { font-size: 2rem; margin-bottom: 4px; color: #0f172a; }
    h2 { font-size: 1.25rem; border-bottom: 2px solid #0f172a; padding-bottom: 4px; margin-top: 28px; }
    .contact { font-size: 0.95rem; color: #475569; margin-bottom: 20px; }
    .skills { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; }
    .skill-tag { background: #f1f5f9; padding: 4px 10px; border-radius: 4px; font-size: 0.9rem; border: 1px solid #cbd5e1; }
    .section-content { white-space: pre-wrap; font-size: 0.95rem; }
    .accommodations-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 14px; margin-top: 24px; }
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${candidateName}</h1>
    ${profile.headline ? `<p style="font-size: 1.1rem; color: #334155; margin-top: 0;">${profile.headline}</p>` : ""}
    <p class="contact">
      ${profile.email ? `<strong>Email:</strong> ${profile.email} &bull; ` : ""}
      ${profile.preferredLocation ? `<strong>Location:</strong> ${profile.preferredLocation} &bull; ` : ""}
      ${profile.workPreference ? `<strong>Preference:</strong> ${profile.workPreference}` : ""}
    </p>
  </header>

  <main>
    ${
      profile.skills.length > 0
        ? `<section aria-labelledby="skills-h">
      <h2 id="skills-h">Skills &amp; Competencies</h2>
      <ul class="skills">
        ${profile.skills.map((s) => `<li class="skill-tag">${s}</li>`).join("\n        ")}
      </ul>
    </section>`
        : ""
    }

    ${
      profile.experience
        ? `<section aria-labelledby="exp-h">
      <h2 id="exp-h">Work Experience</h2>
      <div class="section-content">${profile.experience}</div>
    </section>`
        : ""
    }

    ${
      profile.education
        ? `<section aria-labelledby="edu-h">
      <h2 id="edu-h">Education &amp; Qualifications</h2>
      <div class="section-content">${profile.education}</div>
    </section>`
        : ""
    }

    ${
      profile.certifications
        ? `<section aria-labelledby="cert-h">
      <h2 id="cert-h">Certifications &amp; Training</h2>
      <div class="section-content">${profile.certifications}</div>
    </section>`
        : ""
    }

    ${
      includeAccommodations && accommodationsList.length > 0
        ? `<aside class="accommodations-box" aria-labelledby="acc-h">
      <h2 id="acc-h" style="border:none; margin-top:0; color:#166534; font-size:1.1rem;">Workplace Accommodations (Voluntary Addendum)</h2>
      <p style="font-size:0.9rem; margin-bottom:6px; color:#15803d;">Requested reasonable accommodations under the RPwD Act 2016 for optimal productivity:</p>
      <ul style="padding-left: 20px; font-size:0.9rem;">
        ${accommodationsList.map((a) => `<li>${a}</li>`).join("\n        ")}
      </ul>
    </aside>`
        : ""
    }
  </main>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidateName.replace(/\s+/g, "_")}_Accessible_Resume.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Accessible HTML Resume downloaded!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FileCheck className="size-5 text-brand" />
              Accessible Resume Generator &amp; Exporter
            </DialogTitle>
            <Badge variant="outline" className="text-xs border-success/40 text-success">
              WCAG 2.2 Compliant
            </Badge>
          </div>
          <DialogDescription>
            Download or print an accessible, ATS-friendly semantic resume structured for screen readers and inclusive employers.
          </DialogDescription>
        </DialogHeader>

        {/* Accommodation Privacy Toggle */}
        <div className="rounded-lg border border-border bg-secondary/40 p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <label htmlFor="include-acc-switch" className="text-xs font-semibold cursor-pointer block">
                Include Workplace Accommodations Addendum
              </label>
              <p className="text-[11px] text-muted-foreground">
                Adds a professional reasonable accommodation statement for interviewers (default: candidate choice).
              </p>
            </div>
            <Switch
              id="include-acc-switch"
              checked={includeAccommodations}
              onCheckedChange={setIncludeAccommodations}
            />
          </div>
        </div>

        {/* Live Resume Preview Frame */}
        <div className="rounded-xl border border-border bg-background p-5 text-sm space-y-4 shadow-inner max-h-[45vh] overflow-y-auto">
          <div className="border-b border-border pb-3">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">{candidateName}</h3>
            {profile.headline && (
              <p className="text-sm font-medium text-brand mt-0.5">{profile.headline}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
              {profile.email && <span>{profile.email}</span>}
              {profile.preferredLocation && <span>&bull; {profile.preferredLocation}</span>}
              {profile.workPreference && <span>&bull; {profile.workPreference}</span>}
              {profile.experienceBand && <span>&bull; {profile.experienceBand}</span>}
            </div>
          </div>

          {profile.skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Skills &amp; Technologies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.experience && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Work Experience
              </h4>
              <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                {profile.experience}
              </p>
            </div>
          )}

          {profile.education && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Education
              </h4>
              <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                {profile.education}
              </p>
            </div>
          )}

          {includeAccommodations && accommodationsList.length > 0 && (
            <div className="rounded-lg border border-success/30 bg-success/5 p-3">
              <h4 className="text-xs font-bold text-success flex items-center gap-1.5 mb-1">
                <ShieldCheck className="size-3.5" />
                Workplace Accommodations (Voluntary Addendum)
              </h4>
              <p className="text-[11px] text-muted-foreground mb-1.5">
                Requested arrangements under the RPwD Act 2016:
              </p>
              <div className="flex flex-wrap gap-1">
                {accommodationsList.map((a) => (
                  <Badge key={a} variant="outline" className="text-[11px] bg-background">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleCopyText}
          >
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy Plain Text"}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handlePrint}
            >
              <Printer className="size-3.5" />
              Print / Save PDF
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5 text-xs bg-brand text-brand-foreground"
              onClick={handleDownloadHtml}
            >
              <Download className="size-3.5" />
              Download Accessible HTML
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
