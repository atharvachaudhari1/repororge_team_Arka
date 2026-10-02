import { useEffect, useRef, useState, useMemo, type ReactNode } from "react";
import {
  MapPin,
  Navigation,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  Sparkles,
  Building2,
  Users,
  CheckCircle2,
  X,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
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

type FreeMapViewProps = {
  center?: Coordinates;
  zoom?: number;
  markers: MapMarkerItem[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: MapMarkerItem | null) => void;
  renderPopup?: (marker: MapMarkerItem) => ReactNode;
  height?: string;
  className?: string;
  onCityJump?: (city: string) => void;
};

export function FreeMapView({
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  markers,
  selectedMarkerId,
  onSelectMarker,
  renderPopup,
  height = "520px",
  className = "",
}: FreeMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(selectedMarkerId || null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tileStyle, setTileStyle] = useState<"osm" | "esri">("osm");

  const activeMarker = useMemo(() => {
    const id = selectedMarkerId ?? activeMarkerId;
    return markers.find((m) => m.id === id) || null;
  }, [markers, selectedMarkerId, activeMarkerId]);

  // Initialize Leaflet map safely on client
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default icon paths if needed
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: false, // We use custom accessible controls
        attributionControl: true,
      });

      // 100% Free OpenStreetMap Standard Tiles (Zero watermarks, zero API key)
      const tileUrl =
        tileStyle === "osm"
          ? "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";

      const attribution =
        tileStyle === "osm"
          ? '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
          : '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &copy; OpenStreetMap contributors';

      const tileLayer = L.tileLayer(tileUrl, {
        attribution,
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      (map as any)._tileLayer = tileLayer;

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;

      setMapLoaded(true);

      // Force proper container layout calculation and fit markers nicely
      setTimeout(() => {
        if (!isMounted || !mapInstanceRef.current) return;
        map.invalidateSize();
        if (markers.length > 0) {
          const bounds = L.latLngBounds(markers.map((m) => [m.position.lat, m.position.lng]));
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        }
      }, 150);
    }

    initMap();

    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update tile layer if style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    const map = mapInstanceRef.current;
    import("leaflet").then((mod) => {
      const L = mod.default;
      if (map._tileLayer) {
        map.removeLayer(map._tileLayer);
      }
      const tileUrl =
        tileStyle === "osm"
          ? "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";

      const attribution =
        tileStyle === "osm"
          ? '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
          : '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &copy; OpenStreetMap contributors';

      map._tileLayer = L.tileLayer(tileUrl, {
        attribution,
        maxZoom: 18,
      }).addTo(map);
    });
  }, [tileStyle, mapLoaded]);

  // Update markers when markers array or active selection changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !mapLoaded) return;

    import("leaflet").then((mod) => {
      const L = mod.default;
      const group = markersLayerRef.current;
      group.clearLayers();

      markers.forEach((marker) => {
        const isSelected = activeMarker?.id === marker.id;
        const isCandidate = marker.type === "candidate";
        const bg = isSelected ? "#141817" : isCandidate ? "#CF4E3D" : "#0D7A5F";

        // Filter out "0%" or meaningless badges
        const showBadge = marker.badge && marker.badge !== "0%" && marker.badge !== "0";
        const badgeHtml = showBadge
          ? `<span style="position:absolute;top:-8px;right:-8px;background:#E5B34C;color:#191716;font-size:9px;font-weight:800;padding:1px 5px;border-radius:9999px;border:1px solid #191716;box-shadow:1px 1px 0px #191716;pointer-events:none;white-space:nowrap;">${marker.badge}</span>`
          : "";

        const icon = L.divIcon({
          className: "custom-leaflet-marker",
          html: `
            <div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:${bg};border:2px solid #191716;color:white;box-shadow:2px 2px 0px rgba(0,0,0,0.3);cursor:pointer;transform:${isSelected ? "scale(1.25)" : "scale(1)"};transition:transform 0.15s ease;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                ${
                  isCandidate
                    ? '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
                    : '<rect width="18" height="14" x="3" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'
                }
              </svg>
              ${badgeHtml}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const leafletMarker = L.marker([marker.position.lat, marker.position.lng], { icon });

        leafletMarker.on("click", () => {
          setActiveMarkerId(marker.id);
          onSelectMarker?.(marker);
          mapInstanceRef.current?.flyTo([marker.position.lat, marker.position.lng], Math.max(mapInstanceRef.current.getZoom(), 11), {
            duration: 0.6,
          });
        });

        leafletMarker.addTo(group);
      });
    });
  }, [markers, activeMarker, mapLoaded, onSelectMarker]);

  // Center flyTo when activeMarker changes from outside
  useEffect(() => {
    if (activeMarker && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [activeMarker.position.lat, activeMarker.position.lng],
        Math.max(mapInstanceRef.current.getZoom(), 11),
        { duration: 0.5 }
      );
    }
  }, [activeMarker]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetCenter = () => {
    if (!mapInstanceRef.current) return;
    if (markers.length > 0) {
      import("leaflet").then((mod) => {
        const L = mod.default;
        const bounds = L.latLngBounds(markers.map((m) => [m.position.lat, m.position.lng]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      });
    } else {
      mapInstanceRef.current.flyTo([center.lat, center.lng], zoom, { duration: 0.8 });
    }
    setActiveMarkerId(null);
    onSelectMarker?.(null);
  };

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-3xl border border-[#191716]/15 dark:border-stone-800 bg-[#FAF7F2] dark:bg-[#1A1816] shadow-[0_2px_12px_rgba(0,0,0,0.03)] ${className}`}
      style={{ height }}
    >
      {/* Top Banner Notice: 100% Free OpenStreetMap */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#191716]/10 dark:border-stone-800 bg-[#FAF7F2] dark:bg-[#1C1A18] px-4 py-2 text-xs text-[#141817] dark:text-stone-300">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-[#7BD3C2] text-[#141817] font-bold text-[10px] shadow-[1px_1px_0px_#191716]">
            FREE
          </span>
          <span className="font-serif">
            100% Free Open-Source Map • Powered by OpenStreetMap
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[11px] text-muted-foreground">
            No API keys • No billing • Zero watermark
          </span>
          <button
            type="button"
            onClick={() => setTileStyle(tileStyle === "osm" ? "esri" : "osm")}
            className="inline-flex items-center gap-1 rounded-full border border-[#191716]/30 bg-card px-2.5 py-1 text-[11px] font-medium hover:bg-secondary transition-colors"
            title="Toggle between OpenStreetMap and Minimal Gray tiles"
          >
            <Layers className="size-3 text-stone-600" />
            {tileStyle === "osm" ? "OpenStreetMap Standard" : "Minimal Gray"}
          </button>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="relative flex-1 w-full h-full min-h-[420px]">
        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: "420px" }} />

        {/* Custom Accessible Map Controls (Floating Top-Right) */}
        <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm p-1 rounded-xl border border-[#191716]/20 shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex size-8 items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex size-8 items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </button>
          <div className="h-px bg-stone-200 dark:bg-stone-800 my-0.5" />
          <button
            type="button"
            onClick={handleResetCenter}
            className="flex size-8 items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors"
            aria-label="Fit all points"
            title="Fit all mapped points"
          >
            <Compass className="size-4" />
          </button>
        </div>

        {/* Floating Detail Overlay Card for Active Marker */}
        {activeMarker && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[400] max-w-sm rounded-2xl border-2 border-[#191716] bg-[#FAF7F2] dark:bg-[#1E1C1A] p-4 shadow-[4px_4px_0px_#191716] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              type="button"
              onClick={() => {
                setActiveMarkerId(null);
                onSelectMarker?.(null);
              }}
              className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 transition-colors"
              aria-label="Close details"
            >
              <X className="size-3.5" />
            </button>

            {renderPopup ? (
              renderPopup(activeMarker)
            ) : (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  {activeMarker.type === "candidate" ? (
                    <Users className="size-3.5 text-[#CF4E3D]" />
                  ) : (
                    <Building2 className="size-3.5 text-[#0D7A5F]" />
                  )}
                  <span>{activeMarker.subtitle || "Geographic Hub"}</span>
                </div>
                <h4 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 pr-5">
                  {activeMarker.title}
                </h4>
                {activeMarker.badge && activeMarker.badge !== "0%" && (
                  <span className="mt-2 inline-block rounded-full bg-[#E5B34C]/20 border border-[#E5B34C] px-2.5 py-0.5 text-xs font-semibold text-stone-800 dark:text-stone-200">
                    {activeMarker.badge}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#191716]/10 dark:border-stone-800 bg-[#FAF7F2] dark:bg-[#1A1816] px-4 py-2.5 text-xs text-stone-700 dark:text-stone-300">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-[#0D7A5F] border border-[#191716]" />
            <span>Job Opportunities</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-[#CF4E3D] border border-[#191716]" />
            <span>Candidate Talent Hubs</span>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Showing {markers.length} mapped points across India
        </div>
      </div>
    </div>
  );
}
