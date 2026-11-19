import {
  LONDON,
  themeFromSun,
  themeFromMonthTable,
  computeSunTimes,
  themeFromTimes,
  writeSunCache,
  writeSavedCoords,
  readSavedCoords,
  fetchSunFromApi,
  requestCoords,
  formatClock,
} from "./sun.js";

const sheet = document.querySelector("[data-animate]");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const toggle = document.querySelector("#theme-toggle");
const label = document.querySelector("[data-theme-label]");

let sunMeta = { sunrise: null, sunset: null, source: "table" };

const readPref = () => {
  try {
    return localStorage.getItem("sg-theme-pref") === "manual"
      ? "manual"
      : "auto";
  } catch {
    return "auto";
  }
};

const readManualTheme = () => {
  try {
    const saved = localStorage.getItem("sg-theme");
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
};

const appliedTheme = () =>
  root.getAttribute("data-theme") === "light" ? "light" : "dark";

const autoTheme = () => {
  const result = themeFromSun(new Date());
  sunMeta = {
    sunrise: result.sunrise,
    sunset: result.sunset,
    source: result.source,
  };
  return result.theme;
};

const syncToggle = () => {
  const theme = appliedTheme();
  const pref = readPref();
  const rise = formatClock(sunMeta.sunrise);
  const set = formatClock(sunMeta.sunset);

  if (toggle) {
    toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      pref === "auto"
        ? `Theme follows sunrise/sunset (now ${theme}). Click to choose manually.`
        : theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode",
    );
    toggle.title =
      pref === "auto"
        ? sunMeta.sunrise && sunMeta.sunset
          ? `Auto · sunrise ${rise} · sunset ${set}`
          : "Auto · based on local sunrise/sunset"
        : "Manual theme · click to switch · double-click for auto";
  }
  if (label) {
    label.textContent =
      pref === "auto"
        ? `Auto · ${theme === "dark" ? "Dark" : "Light"}`
        : theme === "dark"
          ? "Dark"
          : "Light";
  }
};

const applyTheme = (theme, pref) => {
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-theme-pref", pref);
  syncToggle();
};

const setManualTheme = (theme) => {
  try {
    localStorage.setItem("sg-theme-pref", "manual");
    localStorage.setItem("sg-theme", theme);
  } catch {
    /* ignore */
  }
  applyTheme(theme, "manual");
};

const setAutoTheme = () => {
  try {
    localStorage.setItem("sg-theme-pref", "auto");
    localStorage.removeItem("sg-theme");
  } catch {
    /* ignore */
  }
  applyTheme(autoTheme(), "auto");
};

const resolveTheme = () => {
  if (readPref() === "manual") {
    const saved = readManualTheme();
    applyTheme(saved || autoTheme() || themeFromMonthTable(), "manual");
  } else {
    applyTheme(autoTheme(), "auto");
  }
};

const adoptSunTimes = (sunrise, sunset, lat, lon, source) => {
  if (!sunrise || !sunset) return;
  writeSunCache(sunrise, sunset, lat, lon);
  sunMeta = { sunrise, sunset, source };
  if (readPref() !== "auto") {
    syncToggle();
    return;
  }
  const next = themeFromTimes(new Date(), sunrise, sunset);
  if (next && next !== appliedTheme()) applyTheme(next, "auto");
  else syncToggle();
};

const refineSunTimes = async () => {
  const saved = readSavedCoords();
  let coords = saved || LONDON;

  // Prefer a precise local calc immediately
  {
    const { sunrise, sunset } = computeSunTimes(new Date(), coords.lat, coords.lon);
    if (sunrise && sunset) {
      adoptSunTimes(sunrise, sunset, coords.lat, coords.lon, "calc");
    }
  }

  // Soften with Open-Meteo when online (same coords)
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3500);
    const api = await fetchSunFromApi(coords.lat, coords.lon, controller.signal);
    window.clearTimeout(timer);
    adoptSunTimes(api.sunrise, api.sunset, coords.lat, coords.lon, "api");
  } catch {
    /* offline / blocked — calc is enough */
  }

  // Optional geolocation refinement (no prompt pressure if denied)
  const geo = await requestCoords();
  if (!geo) return;
  writeSavedCoords(geo.lat, geo.lon);
  coords = geo;

  const local = computeSunTimes(new Date(), geo.lat, geo.lon);
  if (local.sunrise && local.sunset) {
    adoptSunTimes(local.sunrise, local.sunset, geo.lat, geo.lon, "geo-calc");
  }

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3500);
    const api = await fetchSunFromApi(geo.lat, geo.lon, controller.signal);
    window.clearTimeout(timer);
    adoptSunTimes(api.sunrise, api.sunset, geo.lat, geo.lon, "geo-api");
  } catch {
    /* ignore */
  }
};

const HIT_VALUE_KEY = "sg-hit-value";
const HIT_CLICKS_KEY = "sg-hit-clicks";
const hitBoard = document.querySelector("#hit-counter");
const hitDigits = document.querySelector("[data-hit-digits]");

const formatHits = (n) => String(Math.max(0, Math.min(99999, n))).padStart(5, "0");

const randomHitStart = () => 10001 + Math.floor(Math.random() * (99999 - 10001 + 1));

const readHitState = () => {
  try {
    const rawValue = localStorage.getItem(HIT_VALUE_KEY);
    const rawClicks = localStorage.getItem(HIT_CLICKS_KEY);
    const value = rawValue == null ? null : Number(rawValue);
    const clicks = rawClicks == null ? 0 : Number(rawClicks);
    if (value == null || Number.isNaN(value)) {
      const start = randomHitStart();
      localStorage.setItem(HIT_VALUE_KEY, String(start));
      localStorage.setItem(HIT_CLICKS_KEY, "0");
      return { value: start, clicks: 0 };
    }
    return {
      value,
      clicks: Number.isNaN(clicks) ? 0 : clicks,
    };
  } catch {
    return { value: randomHitStart(), clicks: 0 };
  }
};

const writeHitState = (value, clicks) => {
  try {
    localStorage.setItem(HIT_VALUE_KEY, String(value));
    localStorage.setItem(HIT_CLICKS_KEY, String(clicks));
  } catch {
    /* ignore */
  }
};

const renderHits = (value) => {
  if (hitDigits) hitDigits.textContent = formatHits(value);
  if (hitBoard) {
    hitBoard.setAttribute(
      "aria-label",
      `Visitor counter showing ${formatHits(value)}. Click to increment.`,
    );
  }
};

const mintHitState = () => {
  const start = randomHitStart();
  writeHitState(start, 0);
  return { value: start, clicks: 0 };
};

let hitState = readHitState();
// Easter egg already fired (or someone is sitting on 00000) — mint a fresh tally.
if (hitState.clicks > 10 || hitState.value === 0) {
  hitState = mintHitState();
}
renderHits(hitState.value);

hitBoard?.addEventListener("click", () => {
  if (hitState.value === 0) {
    // Recover from the joke tripwire with a fresh tally.
    hitState = { value: randomHitStart(), clicks: 1 };
  } else {
    const nextClicks = hitState.clicks + 1;
    if (nextClicks > 10) {
      // Joke tripwire: flash 00000; next click or refresh remints.
      hitState = { value: 0, clicks: 0 };
    } else {
      hitState = { value: hitState.value + 1, clicks: nextClicks };
    }
  }
  writeHitState(hitState.value, hitState.clicks);
  renderHits(hitState.value);
});

toggle?.addEventListener("click", () => {
  const next = appliedTheme() === "light" ? "dark" : "light";
  setManualTheme(next);
});

toggle?.addEventListener("dblclick", (event) => {
  event.preventDefault();
  setAutoTheme();
});

resolveTheme();
void refineSunTimes();

window.setInterval(() => {
  if (readPref() !== "auto") return;
  const next = autoTheme();
  if (next !== appliedTheme()) applyTheme(next, "auto");
}, 60_000);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") resolveTheme();
});

const reveal = () => {
  requestAnimationFrame(() => {
    sheet?.classList.add("is-ready");
    sheet?.classList.remove("is-animating");
  });
};

if (!sheet || reduce) {
  sheet?.classList.remove("is-animating");
  sheet?.classList.add("is-ready");
} else {
  sheet.classList.add("is-animating");
  if (document.fonts?.ready) {
    document.fonts.ready.then(reveal).catch(reveal);
  } else {
    reveal();
  }
}
