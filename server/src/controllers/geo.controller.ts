import { Request, Response } from "express";

type ReverseGeocodeResponse = {
  city: string | null;
  state: string | null;
  country: string | null;
  countryCode: string | null;
  display: string | null;
};

type OpenWeatherReverseItem = {
  name?: string;
  country?: string;
  state?: string;
};

const cache = new Map<string, { expiresAt: number; value: ReverseGeocodeResponse }>();

function getCacheKey(lat: number, lng: number) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function toDisplay(parts: Array<string | null | undefined>) {
  const cleaned = parts
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean);
  return cleaned.length ? cleaned.join(", ") : null;
}

function countryNameFromCode(countryCode: string) {
  const normalized = countryCode.trim().toUpperCase();
  if (!normalized) return null;

  try {
    // Node 20+ should support this. If it doesn't, we gracefully fall back.
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    return displayNames.of(normalized) ?? normalized;
  } catch {
    return normalized;
  }
}

export async function reverseGeocode(req: Request, res: Response) {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng ?? req.query.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "Invalid lat/lng." });
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ error: "lat/lng out of range." });
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENWEATHERMAP_API_KEY is not set." });
  }

  const key = getCacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.value);
  }

  try {
    const url = new URL("https://api.openweathermap.org/geo/1.0/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("limit", "1");
    url.searchParams.set("appid", apiKey);

    const resp = await fetch(url.toString());
    if (!resp.ok) {
      return res.status(502).json({ error: "Reverse geocode failed." });
    }

    const json = (await resp.json()) as OpenWeatherReverseItem[];
    const first = json?.[0];

    const city = first?.name ? String(first.name) : null;
    const state = first?.state ? String(first.state) : null;
    const countryCode = first?.country ? String(first.country) : null;
    const country = countryCode ? countryNameFromCode(countryCode) : null;

    const value: ReverseGeocodeResponse = {
      city,
      state,
      country,
      countryCode,
      display: toDisplay([city, state, country]),
    };

    cache.set(key, { value, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
    return res.json(value);
  } catch {
    return res.status(502).json({ error: "Reverse geocode failed." });
  }
}
