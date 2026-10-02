import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  MapPin,
  Briefcase,
  Sparkles,
  Accessibility,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { FreeMapView, type MapMarkerItem } from "./free-map-view";
import {
  getCoordinatesForCity,
  getCoordinatesForJob,
  getOffsetCoordinates,
  DEFAULT_MAP_CENTER,
} from "@/lib/locations";
import { ACCESS_FEATURES, type Job, type AccessFeature } from "@/lib/jobs-data";
import { useAppState } from "@/lib/app-state";
import { accessibilityFit } from "@/lib/accessibility";

type JobMapExplorerProps = {
  jobs: Job[];
  height?: string;
  className?: string;
};

export function JobMapExplorer({ jobs, height = "560px", className = "" }: JobMapExplorerProps) {
  const { profile } = useAppState();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedAccessFilter, setSelectedAccessFilter] = useState<string>("all");

  // Group jobs by city to calculate offsets
  const cityJobBuckets = useMemo(() => {
    const buckets: Record<string, Job[]> = {};
    for (const job of jobs) {
      const city = job.city || "Remote";
      if (!buckets[city]) buckets[city] = [];
      buckets[city].push(job);
    }
    return buckets;
  }, [jobs]);

  // Convert jobs into map markers
  const markers: MapMarkerItem[] = useMemo(() => {
    const list: MapMarkerItem[] = [];

    // Filter by accessibility feature if selected
    const filtered = selectedAccessFilter === "all"
      ? jobs
      : jobs.filter((j) => j.access.includes(selectedAccessFilter as AccessFeature));

    // Group jobs by geographic coordinate key to only micro-offset jobs at the exact same location
    const locationBuckets: Record<string, { baseCoords: Coordinates; jobs: Job[] }> = {};
    for (const j of filtered) {
      const coords = getCoordinatesForJob(j);
      const key = `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`;
      if (!locationBuckets[key]) {
        locationBuckets[key] = { baseCoords: coords, jobs: [] };
      }
      locationBuckets[key].jobs.push(j);
    }

    Object.values(locationBuckets).forEach(({ baseCoords, jobs: samePlaceJobs }) => {
      samePlaceJobs.forEach((job, index) => {
        const position = getOffsetCoordinates(baseCoords, index, samePlaceJobs.length);
        const fit = accessibilityFit(profile.accessibilityPreferences, job);

        // Only show badge when candidate has meaningful preferences, or indicate remote
        const badge =
          fit && fit.hasPreferences && fit.score > 0
            ? `${fit.score}%`
            : job.workMode === "Remote"
            ? "Remote"
            : undefined;

        list.push({
          id: job.id,
          title: job.title,
          subtitle: `${job.company} • ${job.city}`,
          position,
          type: "job",
          badge,
          data: { job, fit },
        });
      });
    });

    return list;
  }, [jobs, selectedAccessFilter, profile.accessibilityPreferences]);

  const activeJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Filter & Accessibility Bar */}
      <div className="flex flex-col gap-2.5 bg-card p-3.5 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-[#3D8B6E]" />
            <h3 className="font-serif font-semibold text-base text-foreground">
              Geospatial Job Locator
            </h3>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
              {markers.length} {markers.length === 1 ? "role" : "roles"} mapped
            </span>
          </div>

          {/* Accessibility Filter Quick Select */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-stone-500 font-serif shrink-0">Filter:</span>
            {[
              { id: "all", label: "All Accommodations" },
              { id: "accessible_workplace", label: "Step-free" },
              { id: "screen_reader", label: "Screen-Reader" },
              { id: "captioned_meetings", label: "Captioned" },
              { id: "flexible_work", label: "Flexible" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedAccessFilter(item.id)}
                className={`rounded-full px-2.5 py-1 text-xs shrink-0 transition-all ${
                  selectedAccessFilter === item.id
                    ? "bg-[#7BD3C2] text-[#141817] font-semibold border border-[#191716] shadow-[1px_1px_0px_#141817]"
                    : "bg-secondary text-stone-600 dark:text-stone-400 hover:text-foreground border border-transparent"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* City Hub Quick Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-border/60 text-xs">
          <span className="text-[11px] text-stone-500 font-serif shrink-0">Jump to Hub:</span>
          {["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata", "Remote (India)"].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                const targetJob = markers.find((m) => m.subtitle?.toLowerCase().includes(city.toLowerCase()));
                if (targetJob) {
                  setSelectedJobId(targetJob.id);
                }
              }}
              className="rounded-full border border-border bg-secondary/50 hover:bg-secondary px-2.5 py-0.5 text-[11px] text-stone-700 dark:text-stone-300 shrink-0 transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Map Component */}
      <FreeMapView
        markers={markers}
        selectedMarkerId={selectedJobId}
        onSelectMarker={(m) => setSelectedJobId(m?.id || null)}
        height={height}
        renderPopup={(marker) => {
          const job = marker.data?.job as Job;
          const fit = marker.data?.fit;
          if (!job) return null;

          return (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-border/80 pb-2">
                <div>
                  <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    {job.workMode} • {job.city}
                  </span>
                  <h4 className="font-serif font-bold text-base text-foreground leading-tight">
                    {job.title}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                    {job.company}
                  </p>
                  {job.accessSource === "Discovered via TinyFish Web Search" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E5B34C]/25 text-[#191716] dark:text-stone-200 border border-[#E5B34C] px-2 py-0.5 text-[10px] font-semibold mt-1">
                      <Sparkles className="size-2.5 text-[#CF4E3D]" />
                      Live Web • TinyFish
                    </span>
                  )}
                </div>
                {fit && (
                  <div className="flex flex-col items-end">
                    <span className="rounded-full bg-[#7BD3C2] text-[#141817] px-2 py-0.5 text-xs font-bold border border-[#191716]">
                      {fit.score}%
                    </span>
                    <span className="text-[10px] text-stone-500 font-serif">Fit match</span>
                  </div>
                )}
              </div>

              {/* Accessibility highlights */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-serif text-stone-500 uppercase tracking-wider font-semibold">
                  Verified Accommodations:
                </span>
                <div className="flex flex-wrap gap-1">
                  {job.access.slice(0, 3).map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded-full border border-stone-200 dark:border-stone-800 bg-secondary/80 px-2 py-0.5 text-[10px] text-foreground"
                    >
                      <CheckCircle2 className="size-2.5 text-[#3D8B6E]" />
                      {ACCESS_FEATURES[a]}
                    </span>
                  ))}
                  {job.access.length > 3 && (
                    <span className="text-[10px] text-stone-500 self-center">
                      +{job.access.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex items-center justify-between pt-2 border-t border-border/80">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  {job.salary || "Competitive"}
                </span>
                <Link
                  to="/jobs/$jobId"
                  params={{ jobId: job.id }}
                  className="inline-flex items-center gap-1 rounded-full border border-[#191716] bg-[#7BD3C2] px-3.5 py-1 text-xs font-bold text-[#141817] shadow-[1px_1px_0px_#141817] hover:bg-[#6ec2b1] transition-all"
                >
                  View Role <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
