export type LoadStatus = "idle" | "loading" | "loaded" | "error";

export type GeoJsonFeature = {
  geometry?: { type?: string; coordinates?: unknown };
  properties?: Record<string, unknown>;
  _layer?: "country" | "state";
};

export type CityRecord = { lat: number; lng: number; name: string };
export type CountryRecord = { lat: number; lng: number; feature: GeoJsonFeature };
export type CityMarker = CityRecord & { displayName?: string };

