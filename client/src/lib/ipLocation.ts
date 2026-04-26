export type IpLocationResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; error: string };

export async function fetchIpLocation(opts?: {
  timeoutMs?: number;
}): Promise<IpLocationResult> {
  const timeoutMs = opts?.timeoutMs ?? 7000;
  const ctrl = new AbortController();
  const timeoutId = window.setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch("https://ipapi.co/json/", { signal: ctrl.signal });
    if (!res.ok) return { ok: false, error: "IP location lookup failed." };
    const data = (await res.json()) as { latitude?: number; longitude?: number };
    if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
      return { ok: false, error: "IP location unavailable." };
    }
    return { ok: true, lat: data.latitude, lng: data.longitude };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "IP location lookup timed out." };
    }
    return { ok: false, error: "IP location lookup failed." };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

