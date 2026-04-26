import {
  useRef,
  useCallback,
  useState,
  lazy,
  Suspense,
} from "react";
import type { GlobeMethods } from "react-globe.gl";
import { MessagePin, MessageType } from "../types/message";
import {
  DEFAULT_CAMERA_DISTANCE,
  ZOOM_CITIES,
  ZOOM_STATES,
} from "./globe/constants";
import { getFeatureCenter } from "./globe/geoUtils";
import type { CityMarker, GeoJsonFeature } from "./globe/types";
import { useGlobeControls } from "./globe/useGlobeControls";
import { useGeoLayers } from "./globe/useGeoLayers";
import { useViewport } from "./globe/useViewport";

interface GlobeViewProps {
  pins: MessagePin[];
  selectedId: string | null;
  onPinClick: (pin: MessagePin) => void;
}

const PIN_COLORS: Record<MessageType, string> = {
  text: "#e2e8f0",
  image: "#7dd3fc",
  audio: "#86efac",
  video: "#f9a8d4",
  document: "#fde68a",
};

const PIN_LABELS: Record<MessageType, string> = {
  text: "Text",
  image: "Image",
  audio: "Audio",
  video: "Video",
  document: "Doc",
};

const Globe = lazy(() => import("react-globe.gl"));

export default function GlobeView({
  pins,
  selectedId,
  onPinClick,
}: GlobeViewProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const viewport = useViewport();
  const { zoom, pov, flyToDistance, handleGlobeReady } = useGlobeControls(globeRef);
  const [focusedCountry, setFocusedCountry] = useState<string | null>(null);
  const { showCities, polygonData, visibleCities } = useGeoLayers({
    zoom,
    pov,
    focusedCountry,
  });

  const handlePinClick = useCallback(
    (point: object, _event: MouseEvent, coords: { lat: number; lng: number }) => {
      flyToDistance(coords.lat, coords.lng, ZOOM_CITIES - 10, 900);
      onPinClick(point as MessagePin);
    },
    [flyToDistance, onPinClick],
  );

  const handlePolygonClick = useCallback(
    (polygon: object, _event: MouseEvent, coords: { lat: number; lng: number }) => {
      const feat = polygon as GeoJsonFeature;
      if (feat._layer === "country") {
        const name = String(feat.properties?.name ?? "").trim();
        setFocusedCountry(name || null);
      }
      const center = getFeatureCenter(feat) ?? coords;
      const targetDist = feat._layer === "state" ? ZOOM_CITIES - 10 : ZOOM_STATES - 10;
      flyToDistance(center.lat, center.lng, targetDist);
    },
    [flyToDistance],
  );

  const handleLabelClick = useCallback(
    (_label: object, _event: MouseEvent, coords: { lat: number; lng: number }) => {
      flyToDistance(coords.lat, coords.lng, 120);
    },
    [flyToDistance],
  );

  const getPointColor = useCallback(
    (point: object) => {
      const pin = point as MessagePin;
      return pin.id === selectedId
        ? "#ffffff"
        : (PIN_COLORS[pin.type] ?? "#ffffff");
    },
    [selectedId],
  );

  const getPointRadius = useCallback(
    (point: object) => {
      return (point as MessagePin).id === selectedId ? 0.75 : 0.45;
    },
    [selectedId],
  );

  const getPointLabel = useCallback((point: object) => {
    const pin = point as MessagePin;
    const color = PIN_COLORS[pin.type] ?? "#ffffff";
    return `<div style="background:rgba(5,5,15,0.92);border:1px solid ${color}33;border-radius:8px;padding:5px 10px;font-family:'Playpen Sans',system-ui,sans-serif;font-size:11px;color:${color};white-space:nowrap;">${PIN_LABELS[pin.type]}</div>`;
  }, []);

  return (
    <div className="globe-container w-full h-full">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            Loading map…
          </div>
        }
      >
        <Globe
          // react-globe.gl's ref typing doesn't flow through React.lazy cleanly
          ref={globeRef as unknown as never}
          width={viewport.width}
          height={viewport.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor="#1e3a5f"
          atmosphereAltitude={0.18}
          onGlobeReady={handleGlobeReady}
          onGlobeRightClick={(coords: { lat: number; lng: number }) =>
            flyToDistance(coords.lat, coords.lng, DEFAULT_CAMERA_DISTANCE, 800)
          }
          showPointerCursor={(objType: string) =>
            objType === "polygon" || objType === "label" || objType === "point"
          }
          polygonsTransitionDuration={0}
          labelsTransitionDuration={0}
          // ── Borders (countries always, states when zoomed) ──
          polygonsData={polygonData}
          polygonAltitude={0.001}
          polygonCapColor={() => "rgba(0,0,0,0)"}
          polygonSideColor={() => "rgba(0,0,0,0)"}
          polygonStrokeColor={(feat: object) => {
            const f = feat as { _layer?: string };
            return f._layer === "state"
              ? "rgba(80,160,255,0.15)"
              : "rgba(100,160,255,0.3)";
          }}
          polygonLabel={(feat: object) => {
            const f = feat as {
              properties?: {
                ADMIN?: string;
                NAME?: string;
                name?: string;
                NAME_1?: string;
                name_en?: string;
              };
              _layer?: string;
            };
            const name =
              f.properties?.ADMIN ??
              f.properties?.NAME ??
              f.properties?.NAME_1 ??
              f.properties?.name ??
              f.properties?.name_en ??
              "";
            if (!name) return "";
            return `<div style="background:rgba(5,5,15,0.85);border-radius:6px;padding:4px 8px;font-family:'Playpen Sans',system-ui,sans-serif;font-size:11px;color:#94a3b8;">${name}</div>`;
          }}
          onPolygonClick={handlePolygonClick}
          // ── City labels ──
          labelsData={showCities ? visibleCities : []}
          labelLat={(c: object) => (c as CityMarker).lat}
          labelLng={(c: object) => (c as CityMarker).lng}
          labelText={(c: object) => (c as CityMarker).displayName ?? ""}
          labelLabel={(c: object) => {
            const city = c as CityMarker;
            if (!city.name) return "";
            return `<div style="background:rgba(5,5,15,0.85);border-radius:6px;padding:4px 8px;font-family:'Playpen Sans',system-ui,sans-serif;font-size:11px;color:#e2e8f0;white-space:nowrap;">${city.name}</div>`;
          }}
          labelSize={(c: object) => ((c as CityMarker).displayName ? 0.22 : 0.02)}
          labelResolution={1}
          labelColor={(c: object) =>
            (c as CityMarker).displayName
              ? "rgba(226,232,240,0.75)"
              : "rgba(148,163,184,0.18)"
          }
          labelDotRadius={(c: object) => ((c as CityMarker).displayName ? 0.14 : 0.1)}
          labelAltitude={0.002}
          onLabelClick={handleLabelClick}
          // ── Message pins ──
          pointsData={pins}
          pointLat="lat"
          pointLng="lng"
          pointColor={getPointColor}
          pointRadius={getPointRadius}
          pointAltitude={0.015}
          pointLabel={getPointLabel}
          onPointClick={handlePinClick}
          pointsMerge={false}
          pointResolution={8}
        />
      </Suspense>
    </div>
  );
}
