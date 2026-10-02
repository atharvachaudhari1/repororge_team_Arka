import { useState, useMemo, type ReactNode } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
} from "@vis.gl/react-google-maps";
import { MapPin, Navigation, Info, ExternalLink, Sparkles, Building2, Users } from "lucide-react";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, type Coordinates } from "@/lib/locations";

export type MapMarkerItem = {
  id: string;
  title: string;
  subtitle?: string;
  position: Coordinates;
  type?: "job" | "candidate" | "office";
  badge?: string;
  data?: any;
};

type GoogleMapViewProps = {
  center?: Coordinates;
  zoom?: number;
  markers: MapMarkerItem[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: MapMarkerItem | null) => void;
  renderPopup?: (marker: MapMarkerItem) => ReactNode;
  height?: string;
  className?: string;
};

export function GoogleMapView({
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  markers,
  selectedMarkerId,
  onSelectMarker,
  renderPopup,
  height = "520px",
  className = "",
}: GoogleMapViewProps) {
  // Read key from Vite env
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || "";
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(selectedMarkerId || null);

  const activeMarker = useMemo(() => {
    const id = selectedMarkerId ?? activeMarkerId;
    return markers.find((m) => m.id === id) || null;
  }, [markers, selectedMarkerId, activeMarkerId]);

  const handleMarkerClick = (marker: MapMarkerItem) => {
    setActiveMarkerId(marker.id);
    onSelectMarker?.(marker);
  };

  // If a valid Google Maps API Key is provided, render official Google Maps SDK
  if (apiKey) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-[#191716]/15 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.03)] ${className}`} style={{ height }}>
        <APIProvider apiKey={apiKey} libraries={["marker"]}>
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={center}
            defaultZoom={zoom}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: "100%", height: "100%" }}
            internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
          >
            {markers.map((marker) => {
              const isSelected = activeMarker?.id === marker.id;
              const isCandidate = marker.type === "candidate";

              return (
                <AdvancedMarker
                  key={marker.id}
                  position={marker.position}
                  title={marker.title}
                  onClick={() => handleMarkerClick(marker)}
                >
                  <div
                    className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-md transition-all cursor-pointer ${
                      isSelected
                        ? "scale-110 bg-[#191716] text-[#FAF7F2] border-[#191716] ring-2 ring-[#7BD3C2]"
                        : isCandidate
                        ? "bg-[#FAF7F2] text-[#191716] border-[#191716]/70 hover:bg-[#7BD3C2]"
                        : "bg-[#7BD3C2] text-[#141817] border-[#191716] hover:bg-[#6ec2b1]"
                    }`}
                  >
                    {isCandidate ? (
                      <Users className="size-3 text-stone-700" />
                    ) : (
                      <Building2 className="size-3 text-stone-900" />
                    )}
                    <span className="truncate max-w-[120px] font-sans">{marker.title}</span>
                    {marker.badge && (
                      <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
                        {marker.badge}
                      </span>
                    )}
                  </div>
                </AdvancedMarker>
              );
            })}

            {activeMarker && (
              <InfoWindow
                position={activeMarker.position}
                onCloseClick={() => {
                  setActiveMarkerId(null);
                  onSelectMarker?.(null);
                }}
              >
                <div className="p-1 max-w-xs text-foreground font-sans">
                  {renderPopup ? (
                    renderPopup(activeMarker)
                  ) : (
                    <div>
                      <h4 className="font-semibold text-sm font-serif">{activeMarker.title}</h4>
                      {activeMarker.subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">{activeMarker.subtitle}</p>
                      )}
                    </div>
                  )}
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    );
  }

  // Interactive Fallback Map (for prototyping when API key is not yet provided in .env)
  return (
    <InteractiveSchematicMap
      center={center}
      markers={markers}
      activeMarker={activeMarker}
      onSelectMarker={handleMarkerClick}
      renderPopup={renderPopup}
      height={height}
      className={className}
    />
  );
}

/**
 * High-fidelity interactive SVG map fallback for seamless offline / zero-key prototyping.
 */
function InteractiveSchematicMap({
  markers,
  activeMarker,
  onSelectMarker,
  renderPopup,
  height,
  className,
}: {
  center: Coordinates;
  markers: MapMarkerItem[];
  activeMarker: MapMarkerItem | null;
  onSelectMarker: (marker: MapMarkerItem) => void;
  renderPopup?: (marker: MapMarkerItem) => ReactNode;
  height: string;
  className: string;
}) {
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("all");

  // Geospatial bounding box for India: lat: 8°N to 36°N, lng: 68°E to 98°E
  const minLat = 7.5;
  const maxLat = 35.5;
  const minLng = 67.5;
  const maxLng = 96.5;

  const projectToPercent = (coords: Coordinates) => {
    const x = ((coords.lng - minLng) / (maxLng - minLng)) * 100;
    // Invert Y because latitude goes upwards (north) while screen Y goes downwards
    const y = ((maxLat - coords.lat) / (maxLat - minLat)) * 100;
    return {
      left: `${Math.max(5, Math.min(95, x))}%`,
      top: `${Math.max(5, Math.min(95, y))}%`,
    };
  };

  const filteredMarkers = useMemo(() => {
    if (selectedCityFilter === "all") return markers;
    return markers.filter((m) => m.title.toLowerCase().includes(selectedCityFilter.toLowerCase()) || m.subtitle?.toLowerCase().includes(selectedCityFilter.toLowerCase()));
  }, [markers, selectedCityFilter]);

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-3xl border border-[#191716]/15 bg-[#FAF7F2] dark:bg-[#1A1816] shadow-[0_2px_12px_rgba(0,0,0,0.03)] ${className}`} style={{ height }}>
      {/* Top Banner Notice for Google Maps Platform key */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#191716]/10 dark:border-stone-800 bg-[#7BD3C2]/15 px-4 py-2 text-xs text-[#141817] dark:text-stone-300">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-[#7BD3C2] text-[#141817] font-bold text-[10px]">
            GMP
          </span>
          <span className="font-serif">
            Google Maps Platform Ready • Prototyping Mode
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-stone-600 dark:text-stone-400">
          <span>Set <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">.env</code> to activate live satellite & terrain</span>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative flex-1 w-full overflow-hidden bg-[#FAF7F2] dark:bg-[#181614] select-none">
        {/* Subtle Map Grid Background & India Outline SVG */}
        <svg
          className="absolute inset-0 size-full pointer-events-none opacity-30 dark:opacity-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#191716" strokeWidth="0.5" strokeDasharray="2 2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#map-grid)" />
          {/* Subtle decorative geographical contour curves */}
          <path
            d="M 200 80 Q 300 40 450 90 T 700 80 Q 850 150 780 300 T 500 450 Q 380 500 300 350 Z"
            fill="none"
            stroke="#191716"
            strokeWidth="1.2"
            opacity="0.25"
          />
        </svg>

        {/* City Filter Pills inside Map */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5 max-w-md bg-white/80 dark:bg-stone-900/80 p-2 rounded-2xl border border-[#191716]/10 backdrop-blur-sm shadow-sm">
          <span className="text-[11px] font-serif text-stone-500 self-center px-1">Jump to:</span>
          {["all", "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune"].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCityFilter(city)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] transition-all ${
                selectedCityFilter === city
                  ? "bg-[#7BD3C2] text-[#141817] font-semibold border border-[#191716]"
                  : "bg-secondary/60 text-stone-600 dark:text-stone-400 hover:text-foreground hover:bg-secondary border border-transparent"
              }`}
            >
              {city === "all" ? "All Locations" : city}
            </button>
          ))}
        </div>

        {/* Map Legend */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3 bg-white/80 dark:bg-stone-900/80 px-3 py-1.5 rounded-full border border-[#191716]/10 text-xs font-serif backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#7BD3C2] border border-[#191716]" />
            <span className="text-[11px] text-stone-700 dark:text-stone-300">Jobs Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#FAF7F2] border border-[#191716]" />
            <span className="text-[11px] text-stone-700 dark:text-stone-300">Applicants / Talent</span>
          </div>
        </div>

        {/* Render Interactive Pin Markers */}
        {filteredMarkers.map((marker) => {
          const isSelected = activeMarker?.id === marker.id;
          const pos = projectToPercent(marker.position);
          const isCandidate = marker.type === "candidate";

          return (
            <div
              key={marker.id}
              style={{ left: pos.left, top: pos.top }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
            >
              <button
                type="button"
                onClick={() => onSelectMarker(marker)}
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-md transition-all active:scale-95 ${
                  isSelected
                    ? "scale-110 bg-[#191716] text-[#FAF7F2] border-2 border-[#7BD3C2] shadow-lg ring-4 ring-[#7BD3C2]/30"
                    : isCandidate
                    ? "bg-[#FAF7F2] text-[#191716] border border-[#191716]/80 hover:bg-[#7BD3C2] hover:scale-105"
                    : "bg-[#7BD3C2] text-[#141817] border border-[#191716] hover:bg-[#6ec2b1] hover:scale-105 shadow-[1px_1px_0px_#141817]"
                }`}
                aria-label={`${marker.title} at ${marker.subtitle || ""}`}
              >
                {isCandidate ? (
                  <Users className="size-3.5 text-stone-800" />
                ) : (
                  <MapPin className="size-3.5 text-stone-900" />
                )}
                <span className="truncate max-w-[130px] font-serif">{marker.title}</span>
                {marker.badge && (
                  <span className="rounded-full bg-black/10 dark:bg-white/20 px-1.5 py-0.2 text-[10px] font-sans font-bold">
                    {marker.badge}
                  </span>
                )}
              </button>

              {/* Pulsing beacon behind selected marker */}
              {isSelected && (
                <span className="absolute -inset-1 rounded-full bg-[#7BD3C2] opacity-40 animate-ping pointer-events-none" />
              )}
            </div>
          );
        })}

        {/* Active Marker Detail Card Popup */}
        {activeMarker && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="rounded-2xl border-2 border-[#191716] dark:border-stone-700 bg-[#FFFDF9] dark:bg-[#1E1C1A] p-4 shadow-[4px_4px_0px_#191716] text-foreground">
              {renderPopup ? (
                renderPopup(activeMarker)
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-base text-foreground">{activeMarker.title}</h4>
                      {activeMarker.subtitle && (
                        <p className="text-xs text-stone-600 dark:text-stone-400">{activeMarker.subtitle}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectMarker(activeMarker)}
                      className="text-stone-400 hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
