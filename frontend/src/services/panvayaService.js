/**
 * Panvaya Logistics Ocean Tracking & Maritime Intelligence Service
 * Standardized DCSA Track & Trace, Vessel AIS, Schedules, and Port Congestion
 */

const PANVAYA_API_KEYS = ["pv_live_UgEqfXK1xa_fsjnSCyuOmmSKIYExhokJ", "pv_live_-Pve3LVsqFSuwHgHjSjn9Yzncz_DlWse"];
const DEFAULT_PANVAYA_KEY = PANVAYA_API_KEYS[0];
const PANVAYA_DIRECT_BASE = "https://api.panvaya.com/api/v1";

// Caching configuration: 12h for Schedules, 2h for Tracking, in-memory for Port Autocomplete
const SCHEDULE_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours
const TRACKING_CACHE_TTL = 2 * 60 * 60 * 1000;  // 2 hours
const portLocationCache = new Map();

export function getPanvayaApiKey() {
  try {
    const key = localStorage.getItem("spj_panvaya_key");
    if (!key || key !== "pv_live_UgEqfXK1xa_fsjnSCyuOmmSKIYExhokJ") {
      localStorage.setItem("spj_panvaya_key", DEFAULT_PANVAYA_KEY);
      return DEFAULT_PANVAYA_KEY;
    }
    return key;
  } catch (e) {
    return DEFAULT_PANVAYA_KEY;
  }
}

export function setPanvayaApiKey(key) {
  try {
    localStorage.setItem("spj_panvaya_key", key?.trim() || DEFAULT_PANVAYA_KEY);
  } catch (e) {}
}

// Schedules Cache Helpers
function getScheduleCacheKey(origin, destination, date) {
  const o = (origin || "").trim().toUpperCase();
  const d = (destination || "").trim().toUpperCase();
  const dt = date ? String(date).trim() : "any";
  return `pv_sched_${o}_${d}_${dt}`;
}

export function getCachedSchedules(origin, destination, date) {
  try {
    const key = getScheduleCacheKey(origin, destination, date);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < SCHEDULE_CACHE_TTL) {
      return { ...parsed.data, _fromCache: true, _cachedAt: parsed.timestamp };
    }
  } catch (e) {}
  return null;
}

export function setCachedSchedules(origin, destination, date, data) {
  try {
    const key = getScheduleCacheKey(origin, destination, date);
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (e) {}
}

export function clearPanvayaCache() {
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("pv_sched_") || k.startsWith("pv_track_"))) {
        toRemove.push(k);
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    portLocationCache.clear();
  } catch (e) {}
}

const RENDER_BACKEND = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL)
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
  : (typeof window !== "undefined" ? `http://${window.location.hostname}:5001` : "http://localhost:5001");

async function requestPanvaya(endpoint, options = {}) {
  const apiKey = getPanvayaApiKey();

  // 1. Try Vercel Serverless Function Proxy (/api/panvaya...)
  try {
    const backendUrl = `/api/panvaya${endpoint}`;
    const res = await fetch(backendUrl, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        ...(options.headers || {})
      }
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    // Fall through to Render backend
  }

  // 2. Try Render Express Backend Proxy (${RENDER_BACKEND}/api/panvaya...)
  try {
    const renderUrl = `${RENDER_BACKEND}/api/panvaya${endpoint}`;
    const res = await fetch(renderUrl, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        ...(options.headers || {})
      }
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (renderErr) {
    // Fall through to direct API
  }

  // 3. Fallback to Direct Panvaya API with multi-key pool failover
  const keysToTry = [apiKey, ...PANVAYA_API_KEYS.filter(k => k !== apiKey)];
  let lastErr = null;
  for (const k of keysToTry) {
    try {
      const directUrl = `${PANVAYA_DIRECT_BASE}${endpoint}`;
      const response = await fetch(directUrl, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": k,
          ...(options.headers || {})
        }
      });
      const data = await response.json();
      if (response.ok) return data;
      if (response.status !== 401 && response.status !== 403 && response.status !== 429) {
        throw new Error(data?.errors?.[0]?.detail || data?.errors?.[0]?.title || `Request failed with HTTP ${response.status}`);
      }
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) throw lastErr;
  throw new Error("Direct Panvaya API failed with all keys");
}

/**
 * 1. Sea Container & Document Tracking (POST /track/ocean)
 * Cached for 2 hours per container to avoid consuming tracking credits repeatedly
 */
export async function trackOceanContainer({ container, bol, bk, scac, includeRoute = true, forceRefresh = false }) {
  const queryId = (container || bol || bk || "").trim().toUpperCase();
  const cacheKey = `pv_track_${queryId}`;

  if (!forceRefresh && queryId) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < TRACKING_CACHE_TTL) {
          console.log(`[Panvaya Cache Hit] Container tracking for ${queryId} loaded from cache (0 tokens consumed)`);
          return { ...data, _fromCache: true, _cachedAt: timestamp };
        }
      }
    } catch (e) {}
  }

  const payload = {};
  if (container) payload.container = container.trim().toUpperCase();
  if (bol) payload.bol = bol.trim().toUpperCase();
  if (bk) payload.bk = bk.trim().toUpperCase();
  if (scac) payload.shipping_line_scac = scac.trim().toUpperCase();
  if (includeRoute) payload.include_route_data = true;

  const result = await requestPanvaya("/track", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (result && queryId) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: result
      }));
    } catch (e) {}
  }

  return result;
}

/**
 * 2. List Supported Ocean Carriers (GET /carriers)
 */
export async function getOceanCarriers() {
  return await requestPanvaya("/carriers", { method: "GET" });
}

/**
 * 3. Point-to-Point Sailing Schedules (POST /schedules/search)
 * Directly queries Panvaya REST API for live ocean schedules.
 * Cached for 12 hours locally to prevent token exhaustion.
 */
export async function searchSailingSchedules({ origin, destination, date, carriers, forceRefresh = false }) {
  const origUpper = (origin || "").trim().toUpperCase();
  const destUpper = (destination || "").trim().toUpperCase();

  // 0. Cache check: return cached results if available and not forced
  if (!forceRefresh) {
    const cached = getCachedSchedules(origUpper, destUpper, date);
    if (cached) {
      console.log(`[Panvaya Cache Hit] Schedules for ${origUpper} ➔ ${destUpper} loaded from cache (0 tokens consumed)`);
      return cached;
    }
  }

  const payload = {
    origin: origUpper,
    destination: destUpper
  };
  if (date) {
    let cleanDate = String(date).trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDate)) {
      const [m, day, y] = cleanDate.split("/");
      cleanDate = `${y}-${m}-${day}`;
    }
    payload.date = cleanDate;
  }
  if (carriers && Array.isArray(carriers) && carriers.length > 0) {
    payload.carriers = carriers;
  }

  // 1. Query Vercel Serverless Function Proxy (/api/panvaya/schedules)
  try {
    const res = await requestPanvaya("/schedules", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (res && res.sailings && Array.isArray(res.sailings)) {
      const output = {
        sailings: res.sailings,
        origin: res.origin || origUpper,
        destination: res.destination || destUpper,
        successfulCarriers: res.successfulCarriers || [],
        savedAt: new Date().toISOString(),
        _fromCache: false
      };
      setCachedSchedules(origUpper, destUpper, date, output);
      return output;
    }
  } catch (err) {
    console.error("[Panvaya Proxy Error]:", err.message);
  }

  // 2. Direct Panvaya REST API fallback with multi-key pool failover
  const activeKey = getPanvayaApiKey();
  const keysToTry = [activeKey, ...PANVAYA_API_KEYS.filter(k => k !== activeKey)];
  for (const k of keysToTry) {
    try {
      const directRes = await fetch(`${PANVAYA_DIRECT_BASE}/schedules/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": k
        },
        body: JSON.stringify(payload)
      });

      if (directRes.ok) {
        const data = await directRes.json();
        if (data && data.sailings && Array.isArray(data.sailings)) {
          const output = {
            sailings: data.sailings,
            origin: data.origin || origUpper,
            destination: data.destination || destUpper,
            successfulCarriers: data.successfulCarriers || [],
            savedAt: new Date().toISOString(),
            _fromCache: false
          };
          setCachedSchedules(origUpper, destUpper, date, output);
          return output;
        }
      }
    } catch (directErr) {
      console.error("[Panvaya Direct Error]:", directErr.message);
    }
  }

  // Return empty list if no active sailings found (NO FAKE GENERATOR)
  return {
    sailings: [],
    origin: origUpper,
    destination: destUpper,
    error: "No active sailings found for this route on Panvaya network."
  };
}

/**
 * 4. Stored Vessel Details (GET /vessels)
 */
export async function getVesselDetails({ imo, mmsi }) {
  const query = new URLSearchParams();
  if (imo) query.append("imo", imo);
  if (mmsi) query.append("mmsi", mmsi);

  return await requestPanvaya(`/vessels?${query.toString()}`, { method: "GET" });
}

/**
 * 5. Latest Vessel Position (GET /vessels/position)
 */
export async function getVesselLivePosition({ imo, mmsi }) {
  const query = new URLSearchParams();
  if (imo) query.append("imo", imo);
  if (mmsi) query.append("mmsi", mmsi);

  return await requestPanvaya(`/vessels/position?${query.toString()}`, { method: "GET" });
}

/**
 * 6. Real-time Port Congestion Telemetry (GET /port-congestion)
 */
export async function getPortCongestion({ locode, country }) {
  const query = new URLSearchParams();
  if (locode) query.append("locode", locode);
  if (country) query.append("country", country);

  return await requestPanvaya(`/port-congestion?${query.toString()}`, { method: "GET" });
}

/**
 * 7. Freight Carbon Calculator (POST /carbon/calculate)
 */
export async function calculateCarbonEmission({ origin, destination, weightKg, mode = "ocean" }) {
  return await requestPanvaya("/carbon", {
    method: "POST",
    body: JSON.stringify({ origin, destination, weightKg: Number(weightKg), mode })
  });
}

/**
 * 8. API Credit Usage & Balance (GET /usage)
 */
export async function getPanvayaUsage() {
  return await requestPanvaya("/usage", { method: "GET" });
}

/**
 * 9. Live Public Location Autocomplete (GET https://api.panvaya.com/api/public/locations/search)
 * Cached in-memory to prevent repeated network requests on typing
 */
export async function searchPortLocations(query, type = "port", limit = 30) {
  if (!query || !query.trim()) return [];
  const qClean = query.trim().toLowerCase();
  const cacheKey = `${qClean}_${type}_${limit}`;
  if (portLocationCache.has(cacheKey)) {
    return portLocationCache.get(cacheKey);
  }

  try {
    const url = `https://api.panvaya.com/api/public/locations/search?q=${encodeURIComponent(query.trim())}&type=${type}&limit=${limit}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      portLocationCache.set(cacheKey, data);
      return data;
    }
  } catch (err) {
    console.warn("Live Panvaya Location Search error:", err);
  }
  return [];
}

/**
 * Helper to normalize and enrich relational ocean tracking payload
 */
export function enrichTrackingData(data) {
  if (!data || !data.containers) return [];

  const locationMap = new Map((data.locations || []).map(l => [l.id, l]));
  const transportMap = new Map((data.transports || []).map(t => [t.id, t]));

  return data.containers.map(c => ({
    containerNumber: c.number,
    equipment: c.equipment,
    status: c.status,
    events: (c.events || []).map(e => ({
      id: e.id,
      code: e.event_code,
      name: e.event_name,
      time: e.event_time,
      isActual: e.actual,
      description: e.description,
      location: locationMap.get(e.location_id) || null,
      transport: transportMap.get(e.transport_id) || null
    }))
  }));
}
