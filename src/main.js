const sheet = document.querySelector("[data-animate]");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const toggle = document.querySelector("#theme-toggle");
const label = document.querySelector("[data-theme-label]");

/** Local daylight window: light 06:00–17:59, dark otherwise. */
const themeFromClock = () => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
};

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

const syncToggle = () => {
  const theme = appliedTheme();
  const pref = readPref();
  if (toggle) {
    toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      pref === "auto"
        ? `Theme follows local time (now ${theme}). Click to choose manually.`
        : theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode",
    );
    toggle.title =
      pref === "auto"
        ? "Auto · based on your local time (6:00–18:00 light)"
        : "Manual theme · click to switch";
  }
  if (label) {
    label.textContent =
      pref === "auto" ? `Auto · ${theme === "dark" ? "Dark" : "Light"}` : theme === "dark" ? "Dark" : "Light";
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
  applyTheme(themeFromClock(), "auto");
};

const resolveTheme = () => {
  if (readPref() === "manual") {
    const saved = readManualTheme();
    applyTheme(saved || themeFromClock(), "manual");
  } else {
    applyTheme(themeFromClock(), "auto");
  }
};

toggle?.addEventListener("click", () => {
  const next = appliedTheme() === "light" ? "dark" : "light";
  setManualTheme(next);
});

// Double-click returns to clock-based auto
toggle?.addEventListener("dblclick", (event) => {
  event.preventDefault();
  setAutoTheme();
});

resolveTheme();

// Keep auto mode in sync if the page stays open across dawn/dusk
window.setInterval(() => {
  if (readPref() !== "auto") return;
  const next = themeFromClock();
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
