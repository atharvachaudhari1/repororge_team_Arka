import { useState, useMemo } from "react";
import {
  Train,
  Car,
  Footprints,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Sparkles,
  Navigation,
  Accessibility,
} from "lucide-react";
import { type Job } from "@/lib/jobs-data";
import { type Profile } from "@/lib/app-state";
import {
  calculateCommuteAccessibility,
  DEFAULT_COMMUTE_PROFILE,
  type CandidateCommuteProfile,
  type TransitMode,
} from "@/lib/commute";

type CommuteAccessibilityCardProps = {
  job: Job;
  profile?: Profile;
  className?: string;
};

export function CommuteAccessibilityCard({
  job,
  profile,
  className = "",
}: CommuteAccessibilityCardProps) {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customProfile, setCustomProfile] = useState<CandidateCommuteProfile>(() => {
    return (
      profile?.commutePreferences || {
        ...DEFAULT_COMMUTE_PROFILE,
        homeCity: profile?.preferredLocation || DEFAULT_COMMUTE_PROFILE.homeCity,
      }
    );
  });

  const commuteResult = useMemo(() => {
    return calculateCommuteAccessibility(job, customProfile);
  }, [job, customProfile]);

  const {
    overallScore,
    tier,
    grade,
    subScores,
    greenFlags,
    warnings,
    routeLegs,
    isRemoteRole,
    workplace,
  } = commuteResult;

  const getScoreColor = (score: number) => {
    if (score >= 88)
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 70) return "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30";
    if (score >= 50)
      return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-destructive bg-destructive/10 border-destructive/30";
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 65) return "bg-blue-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-destructive";
  };

  return (
    <section
      aria-labelledby="commute-accessibility-heading"
      className={`rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Accessibility className="size-4" />
            </span>
            <h2 id="commute-accessibility-heading" className="text-lg font-bold text-foreground">
              Accessibility-Aware Commute Scoring
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Evaluates step-free transit, last-mile sidewalk terrain, curb cuts, and workplace entry
            specifically for this office location.
          </p>
        </div>

        {/* Overall Match Badge */}
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 font-semibold text-xs ${getScoreColor(
              overallScore,
            )}`}
          >
            <span className="text-base font-black">{overallScore}%</span>
            <div className="flex flex-col text-[11px] leading-tight">
              <span>{tier}</span>
              <span className="text-[9px] font-normal opacity-80">Grade {grade}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomizer((s) => !s)}
            className="inline-flex items-center gap-1 rounded-lg border border-border/80 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-expanded={showCustomizer}
            aria-controls="commute-preferences-panel"
          >
            <Sliders className="size-3.5 text-brand" />
            <span>Customize</span>
            {showCustomizer ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        </div>
      </div>

      {/* Interactive Customizer Panel */}
      {showCustomizer && (
        <div
          id="commute-preferences-panel"
          className="my-4 rounded-xl border border-brand/20 bg-brand/5 p-4 space-y-4 animate-in fade-in-50"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sliders className="size-3.5 text-brand" />
              Your Transit & Accessibility Criteria
            </h3>
            <span className="text-[11px] text-muted-foreground">Adjusts score live</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Step-free public transit toggle */}
            <label className="flex items-start gap-2 p-2 rounded-lg bg-background/80 border border-border/60 cursor-pointer hover:bg-background">
              <input
                type="checkbox"
                checked={customProfile.needsStepFreeTransit}
                onChange={(e) =>
                  setCustomProfile((p) => ({ ...p, needsStepFreeTransit: e.target.checked }))
                }
                className="mt-0.5 rounded text-brand focus:ring-brand"
              />
              <div>
                <span className="font-medium text-foreground block">
                  Step-free public transit required
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Require continuous elevator access and level boarding on Metro & buses.
                </span>
              </div>
            </label>

            {/* Company cab toggle */}
            <label className="flex items-start gap-2 p-2 rounded-lg bg-background/80 border border-border/60 cursor-pointer hover:bg-background">
              <input
                type="checkbox"
                checked={customProfile.needsCompanyCabOrAllowance}
                onChange={(e) =>
                  setCustomProfile((p) => ({
                    ...p,
                    needsCompanyCabOrAllowance: e.target.checked,
                  }))
                }
                className="mt-0.5 rounded text-brand focus:ring-brand"
              />
              <div>
                <span className="font-medium text-foreground block">
                  Employer accessible cab or travel allowance
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Prioritize roles offering door-to-door accessible transport or subsidies.
                </span>
              </div>
            </label>

            {/* Reserved parking toggle */}
            <label className="flex items-start gap-2 p-2 rounded-lg bg-background/80 border border-border/60 cursor-pointer hover:bg-background">
              <input
                type="checkbox"
                checked={customProfile.needsReservedParking}
                onChange={(e) =>
                  setCustomProfile((p) => ({ ...p, needsReservedParking: e.target.checked }))
                }
                className="mt-0.5 rounded text-brand focus:ring-brand"
              />
              <div>
                <span className="font-medium text-foreground block">
                  Reserved PwD accessible parking bay
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Designated wide parking spot with ramp directly to elevator lobby.
                </span>
              </div>
            </label>

            {/* Avoid peak crowds */}
            <label className="flex items-start gap-2 p-2 rounded-lg bg-background/80 border border-border/60 cursor-pointer hover:bg-background">
              <input
                type="checkbox"
                checked={customProfile.avoidsPeakHourCrowds}
                onChange={(e) =>
                  setCustomProfile((p) => ({ ...p, avoidsPeakHourCrowds: e.target.checked }))
                }
                className="mt-0.5 rounded text-brand focus:ring-brand"
              />
              <div>
                <span className="font-medium text-foreground block">
                  Avoid peak rush-hour crowds
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Flexible timings to travel off-peak for low sensory stress & physical safety.
                </span>
              </div>
            </label>
          </div>

          {/* Maximum walking distance selector */}
          <div className="pt-2 border-t border-brand/10">
            <span className="text-xs font-semibold text-foreground block mb-2">
              Maximum comfortable walking/wheeling distance:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[250, 500, 1000, 2000].map((meters) => (
                <button
                  key={meters}
                  type="button"
                  onClick={() => setCustomProfile((p) => ({ ...p, maxWalkDistanceMeters: meters }))}
                  className={`rounded-lg border py-1.5 text-center text-xs font-medium transition-colors ${
                    customProfile.maxWalkDistanceMeters === meters
                      ? "border-brand bg-brand text-brand-foreground font-semibold"
                      : "border-border/80 bg-background/80 hover:bg-background text-muted-foreground"
                  }`}
                >
                  {meters < 1000 ? `${meters}m` : `${meters / 1000}km`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Workplace Snapshot */}
      <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-brand shrink-0" />
          <div>
            <span className="font-semibold text-foreground">{workplace.businessPark}</span>
            <span className="text-muted-foreground block text-[11px]">
              {workplace.officeAddress}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {workplace.nearestMetro && (
            <span className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-[11px] font-medium border border-border/80">
              <Train className="size-3 text-blue-500" />
              {workplace.nearestMetro.name} ({workplace.nearestMetro.distanceMeters}m)
            </span>
          )}
          {workplace.commuteBenefits.companyCabService && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <Car className="size-3 text-emerald-600 dark:text-emerald-400" />
              Company Cab
            </span>
          )}
        </div>
      </div>

      {/* Sub-Score Bars */}
      {!isRemoteRole && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Transit Proximity */}
          <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground flex items-center gap-1">
                <Train className="size-3.5 text-blue-500" />
                Transit Proximity
              </span>
              <span className="font-bold text-foreground">{subScores.transitScore}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div
                className={`h-full ${getBarColor(subScores.transitScore)} transition-all duration-300`}
                style={{ width: `${subScores.transitScore}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground block leading-tight">
              {workplace.nearestMetro
                ? `${workplace.nearestMetro.distanceMeters}m to ${workplace.nearestMetro.line}`
                : "Bus & cab feeder accessible"}
            </span>
          </div>

          {/* Last-Mile Pathway */}
          <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground flex items-center gap-1">
                <Footprints className="size-3.5 text-emerald-500" />
                Last-Mile Pathway
              </span>
              <span className="font-bold text-foreground">{subScores.lastMileScore}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div
                className={`h-full ${getBarColor(subScores.lastMileScore)} transition-all duration-300`}
                style={{ width: `${subScores.lastMileScore}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground block leading-tight">
              Grade {workplace.lastMilePathway.barrierFreeGrade} •{" "}
              {workplace.lastMilePathway.pavementQuality === "smooth_paved"
                ? "Paved with curb cuts"
                : "Standard roadway"}
            </span>
          </div>

          {/* Workplace Entry */}
          <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground flex items-center gap-1">
                <Building className="size-3.5 text-amber-500" />
                Workplace Entry
              </span>
              <span className="font-bold text-foreground">{subScores.workplaceAccessScore}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div
                className={`h-full ${getBarColor(
                  subScores.workplaceAccessScore,
                )} transition-all duration-300`}
                style={{ width: `${subScores.workplaceAccessScore}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground block leading-tight">
              Elevator access & step-free lobby ramps
            </span>
          </div>

          {/* Assistance & Benefits */}
          <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground flex items-center gap-1">
                <Car className="size-3.5 text-brand" />
                Assistance & Perks
              </span>
              <span className="font-bold text-foreground">{subScores.assistanceScore}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div
                className={`h-full ${getBarColor(subScores.assistanceScore)} transition-all duration-300`}
                style={{ width: `${subScores.assistanceScore}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground block leading-tight">
              {workplace.commuteBenefits.companyCabService
                ? "Company cab service available"
                : workplace.commuteBenefits.cabSubsidyMonthlyInr
                  ? `₹${workplace.commuteBenefits.cabSubsidyMonthlyInr}/mo allowance`
                  : "Flexible commute shift"}
            </span>
          </div>
        </div>
      )}

      {/* Green Flags & Alerts */}
      <div className="mt-5 space-y-2">
        {greenFlags.map((flag, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-foreground"
          >
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{flag}</span>
          </div>
        ))}

        {warnings.map((warn, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200"
          >
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{warn}</span>
          </div>
        ))}
      </div>

      {/* Step-by-Step Commute Journey Breakdown */}
      <div className="mt-6 border-t border-border/60 pt-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Navigation className="size-3.5 text-brand" />
          Step-by-Step Accessible Journey Breakdown
        </h3>

        <div className="mt-3.5 space-y-3">
          {routeLegs.map((leg) => (
            <div
              key={leg.legNumber}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/10 p-3.5 transition-colors hover:bg-muted/20"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold">
                {leg.legNumber}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                  <span className="font-semibold text-foreground">{leg.title}</span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {leg.distanceOrDuration}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{leg.description}</p>
                <div className="pt-1 flex items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="size-3" />
                    {leg.accessibilityNotes}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
