const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export type ReverseGeocodeResult = {
  city: string | null;
  state: string | null;
  country: string | null;
  countryCode: string | null;
  display: string | null;
};

const cache = new Map<string, { expiresAt: number; value: ReverseGeocodeResult }>();

function getCacheKey(lat: number, lng: number) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  opts?: { signal?: AbortSignal }
): Promise<ReverseGeocodeResult> {
  const key = getCacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const url = new URL(`${BASE_URL}/api/geo/reverse`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));

  const res = await fetch(url.toString(), { signal: opts?.signal });
  const data = (await res.json()) as ReverseGeocodeResult | { error: string };
  if (!res.ok) throw new Error("error" in data ? data.error : "Failed to reverse geocode");

  const value = data as ReverseGeocodeResult;
  cache.set(key, { value, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  return value;
}

