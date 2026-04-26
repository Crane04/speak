import { CITY_GRID_DEG, CITY_TEXT_GRID_DEG } from "./constants";
import { CityRecord, GeoJsonFeature } from "./types";

export function wrapLngDiffDegrees(a: number, b: number) {
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  return d;
}

export function computeBbox(
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

export function getFeatureCenter(feature: GeoJsonFeature): { lat: number; lng: number } | null {
  const bbox = computeBbox(feature.geometry?.coordinates);
  if (!bbox) return null;
  return {
    lat: (bbox.minLat + bbox.maxLat) / 2,
    lng: (bbox.minLng + bbox.maxLng) / 2,
  };
}

export function buildCityGridIndex(cities: CityRecord[]) {
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

export function pickClosestLatLng<T extends { lat: number; lng: number }>(
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

export function pickNonOverlappingCityNames(
  candidates: CityRecord[],
  center: { lat: number; lng: number },
  limit: number,
) {
  const byCell = new Map<string, { city: CityRecord; d2: number }>();

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

