import {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
  lazy,
  Suspense,
} from "react";
import type { GlobeMethods } from "react-globe.gl";
import { MessagePin, MessageType } from "../types/message";

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
  text: "📝",
  image: "🖼",
  audio: "🎵",
  video: "🎬",
  document: "📄",
};

const Globe = lazy(() => import("react-globe.gl"));

const GEO_COUNTRIES_URL = "/countries.simplified.geojson";
const GEO_ADMIN1_URL = "/admin1.simplified.geojson";
const GEO_CITIES_URL = "/cities.min.json";

const ZOOM_COUNTRIES = 520;
const ZOOM_STATES = 300;
const ZOOM_CITIES = 120;
const DEFAULT_CAMERA_DISTANCE = 600;
const CITY_GRID_DEG = 2;
const MAX_CITY_LABELS = 200;
const CAMERA_SAMPLE_MS = 120;
const CITY_TEXT_GRID_DEG = 0.6;

type LoadStatus = "idle" | "loading" | "loaded" | "error";

type GeoJsonFeature = {
  geometry?: { type?: string; coordinates?: unknown };
  properties?: Record<string, unknown>;
  _layer?: "country" | "state";
};

type CityRecord = { lat: number; lng: number; name: string };
type CountryRecord = { lat: number; lng: number; feature: GeoJsonFeature };
type CityMarker = CityRecord & { displayName?: string };

function wrapLngDiffDegrees(a: number, b: number) {
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  return d;
}

function computeBbox(
  node: unknown,
  acc?: { minLng: number; maxLng: number; minLat: number; maxLat: number },
) {
  if (Array.isArray(node)) {
    if (
      node.length >= 2 &&
      typeof node[0] === "number" &&
      typeof node[1] === "number"
    ) {
      const lng = node[0];
      const lat = node[1];
      const next = acc ?? {
        minLng: lng,
        maxLng: lng,
        minLat: lat,
        maxLat: lat,
      };
      next.minLng = Math.min(next.minLng, lng);
      next.maxLng = Math.max(next.maxLng, lng);
      next.minLat = Math.min(next.minLat, lat);
      next.maxLat = Math.max(next.maxLat, lat);
      return next;
    }

    let cur = acc;
    for (const child of node) {
      cur = computeBbox(child, cur);
    }
    return cur;
  }

  return acc;
}

function getFeatureCenter(feature: GeoJsonFeature): { lat: number; lng: number } | null {
  const bbox = computeBbox(feature.geometry?.coordinates);
  if (!bbox) return null;
  return {
    lat: (bbox.minLat + bbox.maxLat) / 2,
    lng: (bbox.minLng + bbox.maxLng) / 2,
  };
}

function buildCityGridIndex(cities: CityRecord[]) {
  const grid = new Map<string, CityRecord[]>();
  for (const city of cities) {
    const latIdx = Math.floor((city.lat + 90) / CITY_GRID_DEG);
    const lngIdx = Math.floor((city.lng + 180) / CITY_GRID_DEG);
    const key = `${latIdx}:${lngIdx}`;
    const bucket = grid.get(key);
    if (bucket) bucket.push(city);
    else grid.set(key, [city]);
  }
  return grid;
}

function pickClosestLatLng<T extends { lat: number; lng: number }>(
  candidates: T[],
  center: { lat: number; lng: number },
  limit: number,
) {
  if (candidates.length <= limit) return candidates;

  const chosen: { item: T; d2: number }[] = [];
  let maxIdx = -1;
  let maxD2 = -1;

  const updateMax = () => {
    maxIdx = 0;
    maxD2 = chosen[0].d2;
    for (let i = 1; i < chosen.length; i++) {
      if (chosen[i].d2 > maxD2) {
        maxD2 = chosen[i].d2;
        maxIdx = i;
      }
    }
  };

  for (const item of candidates) {
    const dLat = item.lat - center.lat;
    const dLng = wrapLngDiffDegrees(item.lng, center.lng);
    const d2 = dLat * dLat + dLng * dLng;

    if (chosen.length < limit) {
      chosen.push({ item, d2 });
      if (d2 > maxD2) {
        maxD2 = d2;
        maxIdx = chosen.length - 1;
      }
      continue;
    }

    if (d2 >= maxD2) continue;
    chosen[maxIdx] = { item, d2 };
    updateMax();
  }

  return chosen.map((c) => c.item);
}

function pickNonOverlappingCityNames(
  candidates: CityRecord[],
  center: { lat: number; lng: number },
  limit: number,
) {
  const byCell = new Map<
    string,
    { city: CityRecord; d2: number }
  >();

  for (const city of candidates) {
    const cellLat = Math.floor((city.lat + 90) / CITY_TEXT_GRID_DEG);
    const cellLng = Math.floor((city.lng + 180) / CITY_TEXT_GRID_DEG);
    const key = `${cellLat}:${cellLng}`;

    const dLat = city.lat - center.lat;
    const dLng = wrapLngDiffDegrees(city.lng, center.lng);
    const d2 = dLat * dLat + dLng * dLng;

    const existing = byCell.get(key);
    if (!existing || d2 < existing.d2) byCell.set(key, { city, d2 });
  }

  const unique = Array.from(byCell.values()).map((v) => v.city);
  return pickClosestLatLng(unique, center, limit);
}

export default function GlobeView({
  pins,
  selectedId,
  onPinClick,
}: GlobeViewProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const controlsCleanupRef = useRef<null | (() => void)>(null);
  const zoomRafRef = useRef<number | null>(null);
  const lastSampleRef = useRef<number>(0);
  const povRef = useRef<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const zoomRef = useRef<number>(DEFAULT_CAMERA_DISTANCE);

  const [countries, setCountries] = useState<CountryRecord[]>([]);
  const [states, setStates] = useState<object[]>([]);
  const [allCities, setAllCities] = useState<CityRecord[]>([]);

  const [countriesStatus, setCountriesStatus] = useState<LoadStatus>("idle");
  const [statesStatus, setStatesStatus] = useState<LoadStatus>("idle");
  const [citiesStatus, setCitiesStatus] = useState<LoadStatus>("idle");

  const [zoom, setZoom] = useState(DEFAULT_CAMERA_DISTANCE);
  const [pov, setPov] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });
  const [focusedCountry, setFocusedCountry] = useState<string | null>(null);
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const onResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    return () => {
      controlsCleanupRef.current?.();
      controlsCleanupRef.current = null;
      if (zoomRafRef.current != null) {
        window.cancelAnimationFrame(zoomRafRef.current);
        zoomRafRef.current = null;
      }
    };
  }, []);

  const distanceToAltitude = useCallback((distance: number) => {
    const radius = globeRef.current?.getGlobeRadius() ?? 100;
    return Math.max(0.01, distance / radius - 1);
  }, []);

  const flyToDistance = useCallback(
    (lat: number, lng: number, distance: number, transitionMs = 1200) => {
      globeRef.current?.pointOfView(
        { lat, lng, altitude: distanceToAltitude(distance) },
        transitionMs,
      );
    },
    [distanceToAltitude],
  );

  const handleGlobeReady = useCallback(() => {
    const ctrl = globeRef.current?.controls();
    if (!ctrl) return;

    ctrl.autoRotate = true;
    ctrl.autoRotateSpeed = 0.3;
    ctrl.enableDamping = true;
    ctrl.dampingFactor = 0.1;
    ctrl.minDistance = 101;
    ctrl.maxDistance = DEFAULT_CAMERA_DISTANCE;

    // Ensure we start far enough out that admin1/cities don't load immediately.
    globeRef.current?.pointOfView(
      { lat: 15, lng: 0, altitude: distanceToAltitude(DEFAULT_CAMERA_DISTANCE) },
      0,
    );

    const onChange = () => {
      if (zoomRafRef.current != null) return;
      zoomRafRef.current = window.requestAnimationFrame(() => {
        zoomRafRef.current = null;
        const dist =
          (globeRef.current?.camera().position.length() as number | undefined) ??
          DEFAULT_CAMERA_DISTANCE;
        zoomRef.current = dist;
        const nextPov = globeRef.current?.pointOfView();
        if (nextPov) povRef.current = { lat: nextPov.lat, lng: nextPov.lng };

        const now = performance.now();
        if (now - lastSampleRef.current < CAMERA_SAMPLE_MS) return;
        lastSampleRef.current = now;

        setZoom(zoomRef.current);
        setPov(povRef.current);
      });
    };

    const onStart = () => {
      ctrl.autoRotate = false;
    };

    ctrl.addEventListener("change", onChange);
    ctrl.addEventListener("start", onStart);
    onChange();

    controlsCleanupRef.current = () => {
      ctrl.removeEventListener("change", onChange);
      ctrl.removeEventListener("start", onStart);
    };
  }, [distanceToAltitude]);

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
    return `<div style="background:rgba(5,5,15,0.92);border:1px solid ${color}33;border-radius:8px;padding:5px 10px;font-family:'Space Mono',monospace;font-size:11px;color:${color};white-space:nowrap;">${PIN_LABELS[pin.type]} ${pin.type.toUpperCase()}</div>`;
  }, []);

  const showStates = zoom < ZOOM_STATES;
  const showCities = zoom < ZOOM_CITIES;
  const showCountries = zoom < ZOOM_COUNTRIES;

  useEffect(() => {
    if (!showCountries || countriesStatus !== "idle") return;
    setCountriesStatus("loading");
    fetch(GEO_COUNTRIES_URL)
      .then((r) => r.json())
      .then((d) => {
        const records: CountryRecord[] = (d.features ?? [])
          .map((feat: object) => {
            const f = feat as GeoJsonFeature;
            const center = getFeatureCenter(f);
            if (!center) return null;
            return {
              lat: center.lat,
              lng: center.lng,
              feature: { ...f, _layer: "country" },
            } satisfies CountryRecord;
          })
          .filter(Boolean) as CountryRecord[];

        setCountries(records);
        setCountriesStatus("loaded");
      })
      .catch(() => {
        setCountries([]);
        setCountriesStatus("error");
      });
  }, [countriesStatus, showCountries]);

  useEffect(() => {
    if (!showStates || !focusedCountry || statesStatus !== "idle") return;
    setStatesStatus("loading");
    fetch(GEO_ADMIN1_URL)
      .then((r) => r.json())
      .then((d) => {
        setStates(d.features ?? []);
        setStatesStatus("loaded");
      })
      .catch(() => {
        setStates([]);
        setStatesStatus("error");
      });
  }, [focusedCountry, showStates, statesStatus]);

  useEffect(() => {
    if (!showCities || citiesStatus !== "idle") return;
    setCitiesStatus("loading");
    fetch(GEO_CITIES_URL)
      .then((r) => r.json())
      .then((d) => {
        const records: CityRecord[] = Array.isArray(d)
          ? (d
              .map((row: unknown) => {
                if (!Array.isArray(row) || row.length < 3) return null;
                const lat = row[0];
                const lng = row[1];
                const name = row[2];
                if (
                  typeof lat !== "number" ||
                  typeof lng !== "number" ||
                  typeof name !== "string" ||
                  !name.trim()
                )
                  return null;
                return { lat, lng, name: name.trim() } satisfies CityRecord;
              })
              .filter(Boolean) as CityRecord[])
          : [];

        setAllCities(records);
        setCitiesStatus("loaded");
      })
      .catch(() => {
        setAllCities([]);
        setCitiesStatus("error");
      });
  }, [showCities, citiesStatus]);

  const visibleStates = useMemo(() => {
    if (!showStates || !focusedCountry) return [];
    const list = states as GeoJsonFeature[];
    return list.filter((f) => String(f.properties?.admin ?? "") === focusedCountry);
  }, [focusedCountry, showStates, states]);

  const visibleCountries = useMemo(() => {
    if (!showCountries || countries.length === 0) return [];

    // Keep polygon count low to avoid huge mesh builds and expensive pointer raycasting.
    const windowDeg = Math.min(65, Math.max(22, zoom / 9));
    const filtered = countries.filter((c) => {
      const dLat = Math.abs(c.lat - pov.lat);
      const dLng = wrapLngDiffDegrees(c.lng, pov.lng);
      return dLat <= windowDeg && dLng <= windowDeg;
    });

    return pickClosestLatLng(filtered, pov, 70);
  }, [countries, pov.lat, pov.lng, showCountries, zoom]);

  const cityGrid = useMemo(() => buildCityGridIndex(allCities), [allCities]);

  const visibleCities = useMemo<CityMarker[]>(() => {
    if (!showCities || allCities.length === 0) return [];

    // In degrees: smaller window as you get closer to the surface.
    const degWindow = Math.min(12, Math.max(1.6, zoom / 35));

    const latBins = Math.ceil(degWindow / CITY_GRID_DEG);
    const lngBins = Math.ceil(degWindow / CITY_GRID_DEG);

    const centerLatIdx = Math.floor((pov.lat + 90) / CITY_GRID_DEG);
    const centerLngIdx = Math.floor((pov.lng + 180) / CITY_GRID_DEG);

    const latBinCount = Math.ceil(180 / CITY_GRID_DEG);
    const lngBinCount = Math.ceil(360 / CITY_GRID_DEG);

    const candidates: CityRecord[] = [];

    for (let dLat = -latBins; dLat <= latBins; dLat++) {
      const latIdx = centerLatIdx + dLat;
      if (latIdx < 0 || latIdx >= latBinCount) continue;

      for (let dLng = -lngBins; dLng <= lngBins; dLng++) {
        let lngIdx = centerLngIdx + dLng;
        lngIdx = ((lngIdx % lngBinCount) + lngBinCount) % lngBinCount;
        const key = `${latIdx}:${lngIdx}`;
        const bucket = cityGrid.get(key);
        if (!bucket) continue;
        candidates.push(...bucket);
      }
    }

    const filtered = candidates.filter((c) => {
      const dLat = Math.abs(c.lat - pov.lat);
      const dLng = wrapLngDiffDegrees(c.lng, pov.lng);
      return dLat <= degWindow && dLng <= degWindow;
    });

    const picked = pickClosestLatLng(filtered, pov, MAX_CITY_LABELS);

    // Show only a small number of city names; keep the rest as dots to avoid a cluttered "word cloud".
    const textLimit = zoom < 95 ? 50 : zoom < 110 ? 20 : 0;
    const named = pickNonOverlappingCityNames(picked, pov, textLimit);
    const namedKeys = new Set(named.map((c) => `${c.lat}:${c.lng}:${c.name}`));

    return picked.map((c) => ({
      ...c,
      displayName: namedKeys.has(`${c.lat}:${c.lng}:${c.name}`) ? c.name : "",
    }));
  }, [allCities.length, cityGrid, pov.lat, pov.lng, showCities, zoom]);

  // Merge countries + states into one polygons array, tagged by type
  const polygonData = useMemo(() => {
    if (!showCountries) return [];

    const countryPolygons = visibleCountries.map((c) => c.feature);

    if (!showStates) return countryPolygons;

    const statePolygons = visibleStates.map((f) => ({
      ...(f as object),
      _layer: "state" as const,
    }));

    return [...countryPolygons, ...statePolygons];
  }, [showCountries, showStates, visibleCountries, visibleStates]);

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
            return `<div style="background:rgba(5,5,15,0.85);border-radius:6px;padding:4px 8px;font-family:'Space Mono',monospace;font-size:11px;color:#94a3b8;">${name}</div>`;
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
            return `<div style="background:rgba(5,5,15,0.85);border-radius:6px;padding:4px 8px;font-family:'Space Mono',monospace;font-size:11px;color:#e2e8f0;white-space:nowrap;">${city.name}</div>`;
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
