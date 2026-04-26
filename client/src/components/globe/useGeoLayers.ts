import { useEffect, useMemo, useState } from "react";
import {
  GEO_ADMIN1_URL,
  GEO_CITIES_URL,
  GEO_COUNTRIES_URL,
  MAX_CITY_LABELS,
  ZOOM_COUNTRIES,
  ZOOM_CITIES,
  ZOOM_STATES,
  CITY_GRID_DEG,
} from "./constants";
import {
  buildCityGridIndex,
  getFeatureCenter,
  pickClosestLatLng,
  pickNonOverlappingCityNames,
  wrapLngDiffDegrees,
} from "./geoUtils";
import { CityMarker, CityRecord, CountryRecord, GeoJsonFeature, LoadStatus } from "./types";

export function useGeoLayers(opts: {
  zoom: number;
  pov: { lat: number; lng: number };
  focusedCountry: string | null;
}) {
  const { zoom, pov, focusedCountry } = opts;

  const [countries, setCountries] = useState<CountryRecord[]>([]);
  const [states, setStates] = useState<object[]>([]);
  const [allCities, setAllCities] = useState<CityRecord[]>([]);

  const [countriesStatus, setCountriesStatus] = useState<LoadStatus>("idle");
  const [statesStatus, setStatesStatus] = useState<LoadStatus>("idle");
  const [citiesStatus, setCitiesStatus] = useState<LoadStatus>("idle");

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
    const textLimit = zoom < 95 ? 50 : zoom < 110 ? 20 : 0;
    const named = pickNonOverlappingCityNames(picked, pov, textLimit);
    const namedKeys = new Set(named.map((c) => `${c.lat}:${c.lng}:${c.name}`));

    return picked.map((c) => ({
      ...c,
      displayName: namedKeys.has(`${c.lat}:${c.lng}:${c.name}`) ? c.name : "",
    }));
  }, [allCities.length, cityGrid, pov.lat, pov.lng, showCities, zoom]);

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

  return {
    showCities,
    polygonData,
    visibleCities,
  };
}
