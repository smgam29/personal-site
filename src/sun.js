/**
 * Day/night helpers for auto theme.
 * - Sync path: cached day’s times, else a London monthly lookup table
 * - Async path: NOAA-style solar calc at lat/lon (default London; optional geolocation)
 */

export const LONDON = { lat: 51.5074, lon: -0.1278 };

/** Mid-month civil sunrise/sunset for London as local clock minutes (approx). */
export const LONDON_MONTH_TABLE = [
  /* Jan */ { rise: 8 * 60, set: 16 * 60 + 20 },
  /* Feb */ { rise: 7 * 60 + 20, set: 17 * 60 + 10 },
  /* Mar */ { rise: 6 * 60 + 20, set: 18 * 60 + 5 },
  /* Apr */ { rise: 6 * 60 + 5, set: 19 * 60 + 50 },
  /* May */ { rise: 5 * 60 + 15, set: 20 * 60 + 45 },
  /* Jun */ { rise: 4 * 60 + 45, set: 21 * 60 + 20 },
  /* Jul */ { rise: 5 * 60 + 5, set: 21 * 60 + 10 },
  /* Aug */ { rise: 5 * 60 + 45, set: 20 * 60 + 25 },
  /* Sep */ { rise: 6 * 60 + 35, set: 19 * 60 + 15 },
  /* Oct */ { rise: 7 * 60 + 25, set: 18 * 60 + 5 },
  /* Nov */ { rise: 7 * 60 + 15, set: 16 * 60 + 20 },
  /* Dec */ { rise: 8 * 60 + 5, set: 15 * 60 + 55 },
];

const CACHE_KEY = "sg-sun-cache";
const COORDS_KEY = "sg-sun-coords";

const dayKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/**
 * Approximate local sunrise/sunset (civil ~ −0.833°) via NOAA solar equations.
 * Returns Date objects in local time, or nulls at polar day/night.
 */
export const computeSunTimes = (date, lat, lon) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const n =
    Math.floor(275 * month / 9) -
    Math.floor((month + 9) / 12) * (1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3)) +
    day -
    30;

  const lngHour = lon / 15;

  const approx = (isRise) => {
    const t = isRise ? n + (6 - lngHour) / 24 : n + (18 - lngHour) / 24;
    const m = 0.9856 * t - 3.289;
    let l =
      m +
      1.916 * Math.sin(toRad(m)) +
      0.02 * Math.sin(toRad(2 * m)) +
      282.634;
    l = ((l % 360) + 360) % 360;

    let ra = toDeg(Math.atan(0.91764 * Math.tan(toRad(l))));
    ra = ((ra % 360) + 360) % 360;
    const lQuad = Math.floor(l / 90) * 90;
    const raQuad = Math.floor(ra / 90) * 90;
    ra = (ra + (lQuad - raQuad)) / 15;

    const sinDec = 0.39782 * Math.sin(toRad(l));
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH =
      (Math.cos(toRad(90.833)) - sinDec * Math.sin(toRad(lat))) /
      (cosDec * Math.cos(toRad(lat)));

    if (cosH > 1 || cosH < -1) return null; // polar night / midnight sun

    const h = isRise
      ? (360 - toDeg(Math.acos(cosH))) / 15
      : toDeg(Math.acos(cosH)) / 15;
    const tLocal = h + ra - 0.06571 * t - 6.622;
    let ut = tLocal - lngHour;
    ut = ((ut % 24) + 24) % 24;

    const out = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    out.setUTCHours(0, 0, 0, 0);
    out.setUTCMilliseconds(Math.round(ut * 3600 * 1000));
    return out;
  };

  return { sunrise: approx(true), sunset: approx(false) };
};

export const themeFromTimes = (now, sunrise, sunset) => {
  if (!(sunrise instanceof Date) || !(sunset instanceof Date)) return null;
  if (Number.isNaN(sunrise.getTime()) || Number.isNaN(sunset.getTime())) {
    return null;
  }
  return now >= sunrise && now < sunset ? "light" : "dark";
};

export const themeFromMonthTable = (now = new Date()) => {
  const row = LONDON_MONTH_TABLE[now.getMonth()];
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= row.rise && minutes < row.set ? "light" : "dark";
};

export const readSunCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.day !== dayKey()) return null;
    if (typeof data.sunrise !== "number" || typeof data.sunset !== "number") {
      return null;
    }
    return {
      sunrise: new Date(data.sunrise),
      sunset: new Date(data.sunset),
      lat: data.lat,
      lon: data.lon,
    };
  } catch {
    return null;
  }
};

export const writeSunCache = (sunrise, sunset, lat, lon) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        day: dayKey(),
        sunrise: sunrise.getTime(),
        sunset: sunset.getTime(),
        lat,
        lon,
      }),
    );
  } catch {
    /* ignore */
  }
};

export const readSavedCoords = () => {
  try {
    const raw = localStorage.getItem(COORDS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data.lat !== "number" || typeof data.lon !== "number") return null;
    return { lat: data.lat, lon: data.lon };
  } catch {
    return null;
  }
};

export const writeSavedCoords = (lat, lon) => {
  try {
    localStorage.setItem(COORDS_KEY, JSON.stringify({ lat, lon }));
  } catch {
    /* ignore */
  }
};

export const themeFromSun = (now = new Date(), coords = null) => {
  const cached = readSunCache();
  if (cached) {
    const theme = themeFromTimes(now, cached.sunrise, cached.sunset);
    if (theme) return { theme, sunrise: cached.sunrise, sunset: cached.sunset, source: "cache" };
  }

  const { lat, lon } = coords || readSavedCoords() || LONDON;
  const { sunrise, sunset } = computeSunTimes(now, lat, lon);
  const theme = themeFromTimes(now, sunrise, sunset);
  if (theme && sunrise && sunset) {
    writeSunCache(sunrise, sunset, lat, lon);
    return { theme, sunrise, sunset, source: "calc", lat, lon };
  }

  return {
    theme: themeFromMonthTable(now),
    sunrise: null,
    sunset: null,
    source: "table",
  };
};

/** Format local HH:MM for tooltips. */
export const formatClock = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/**
 * Optional Open-Meteo check (no key, CORS-friendly). Falls back silently.
 */
/** Parse Open-Meteo daily ISO wall-clock using the response utc offset. */
const parseApiLocal = (iso, offsetSeconds) => {
  const [date, time = "00:00"] = String(iso).split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm = 0, ss = 0] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm, ss) - offsetSeconds * 1000);
};

export const fetchSunFromApi = async (lat, lon, signal) => {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("daily", "sunrise,sunset");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "1");

  const res = await fetch(url, { signal, credentials: "omit" });
  if (!res.ok) throw new Error(`sun api ${res.status}`);
  const json = await res.json();
  const rise = json?.daily?.sunrise?.[0];
  const set = json?.daily?.sunset?.[0];
  if (!rise || !set) throw new Error("sun api missing times");
  const offset = Number(json.utc_offset_seconds) || 0;
  return {
    sunrise: parseApiLocal(rise, offset),
    sunset: parseApiLocal(set, offset),
  };
};

/** Only use geolocation when permission is already granted (no prompt). */
export const requestCoords = async () => {
  try {
    if (!navigator.geolocation) return null;
    if (navigator.permissions?.query) {
      const status = await navigator.permissions.query({ name: "geolocation" });
      if (status.state !== "granted") return null;
    } else {
      return null;
    }
    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, maximumAge: 86_400_000, timeout: 2_000 },
      );
    });
  } catch {
    return null;
  }
};