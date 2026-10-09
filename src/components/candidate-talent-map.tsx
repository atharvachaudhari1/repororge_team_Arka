import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  ExternalLink,
  Lock,
  Sparkles,
} from "lucide-react";
import { FreeMapView, type MapMarkerItem } from "./free-map-view";
import {
  MOCK_CANDIDATE_LOCATIONS,
  type CandidateLocationCluster,
  getCoordinatesForCity,
} from "@/lib/locations";
import { useAppState } from "@/lib/app-state";

type CandidateTalentMapProps = {
  height?: string;
  className?: string;
};

export function CandidateTalentMap({ height = "520px", className = "" }: CandidateTalentMapProps) {
  const { applications, employerJobs, profile } = useAppState();
  const [selectedClusterCity, setSelectedClusterCity] = useState<string | null>(null);

  // Combine real application data with candidate location clusters
  const clusters: CandidateLocationCluster[] = useMemo(() => {
    // If the active candidate profile has a preferred location, reflect it
    const candidateCity = profile.preferredLocation || "Mumbai";
    return MOCK_CANDIDATE_LOCATIONS.map((cluster) => {
      const isCandidateCity = cluster.city.toLowerCase() === candidateCity.toLowerCase();
      const extraCount = isCandidateCity ? applications.length : 0;
      return {
        ...cluster,
        candidateCount: cluster.candidateCount + extraCount,
      };
    });
  }, [applications, profile]);

  // Convert clusters into MapMarkerItem[]
  const markers: MapMarkerItem[] = useMemo(() => {
    return clusters.map((cluster) => ({
      id: cluster.city,
      title: `${cluster.city}`,
      subtitle: `${cluster.candidateCount} active candidates`,
      position: cluster.coords,
      type: "candidate",
      badge: `${cluster.candidateCount}`,
      data: cluster,
    }));
  }, [clusters]);

  const totalCandidates = useMemo(() => {
    return clusters.reduce((acc, c) => acc + c.candidateCount, 0);
  }, [clusters]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overview Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-[#3D8B6E]" />
            <h3 className="font-serif font-semibold text-base text-foreground">
              Candidate & Applicant Geospatial Distribution
            </h3>
          </div>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Explore active talent pools across India by location, work preferences, and
            accessibility needs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
            <span className="size-2 rounded-full bg-[#7BD3C2]" />
            {totalCandidates} Candidates Across {clusters.length} Hubs
          </span>
        </div>
      </div>

      {/* Main Map */}
      <FreeMapView
        markers={markers}
        selectedMarkerId={selectedClusterCity}
        onSelectMarker={(m) => setSelectedClusterCity(m?.id || null)}
        height={height}
        renderPopup={(marker) => {
          const cluster = marker.data as CandidateLocationCluster;
          if (!cluster) return null;

          return (
            <div className="space-y-3 font-sans">
              <div className="flex items-start justify-between border-b border-border/80 pb-2">
                <div>
                  <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    {cluster.state} Region
                  </span>
                  <h4 className="font-serif font-bold text-lg text-foreground">
                    {cluster.city} Hub
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    {cluster.candidateCount} Qualified Candidates Available
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="rounded-full bg-[#7BD3C2] text-[#141817] px-2.5 py-0.5 text-xs font-bold border border-[#191716]">
                    {cluster.openForRemote} Remote-Ready
                  </span>
                </div>
              </div>

              {/* Sample Roles in this hub */}
              <div className="space-y-1">
                <span className="text-[11px] font-serif text-stone-500 uppercase tracking-wider font-semibold">
                  Common Candidate Roles:
                </span>
                <div className="flex flex-wrap gap-1">
                  {cluster.sampleRoles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-border bg-secondary/80 px-2 py-0.5 text-[10px] text-foreground"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Primary Accommodations requested in this area */}
              <div className="space-y-1">
                <span className="text-[11px] font-serif text-stone-500 uppercase tracking-wider font-semibold">
                  Top Requested Accommodations:
                </span>
                <div className="space-y-0.5">
                  {cluster.topAccommodations.map((acc) => (
                    <div
                      key={acc}
                      className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-stone-300"
                    >
                      <CheckCircle2 className="size-3 text-[#3D8B6E] shrink-0" />
                      <span>{acc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Footer */}
              <div className="pt-2 border-t border-border/80 flex items-center justify-between text-[11px] text-stone-500">
                <div className="flex items-center gap-1">
                  <Lock className="size-3 text-stone-400" />
                  <span>Aggregated by Metro</span>
                </div>
                <Link
                  to="/employer"
                  className="font-serif text-xs font-bold text-foreground hover:underline"
                >
                  View Applicants →
                </Link>
              </div>
            </div>
          );
        }}
      />

      {/* Privacy Guarantee Note */}
      <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/50 p-3 text-xs text-stone-600 dark:text-stone-400">
        <ShieldCheck className="size-4 shrink-0 text-[#3D8B6E]" />
        <span>
          <strong>Candidate Privacy Shield:</strong> Locations are presented at the metropolitan hub
          level to protect candidate confidentiality. Personal addresses, contact details, and
          private disability notes are never displayed publicly on maps.
        </span>
      </div>
    </div>
  );
}
