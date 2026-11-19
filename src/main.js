const sheet = document.querySelector("[data-animate]");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const toggle = document.querySelector("#theme-toggle");
const label = document.querySelector("[data-theme-label]");

const syncToggle = () => {
  const theme = root.getAttribute("data-theme") === "light" ? "light" : "dark";
  if (toggle) {
    toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
    );
  }
  if (label) label.textContent = theme === "dark" ? "Dark" : "Light";
};

const setTheme = (theme) => {
  root.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("sg-theme", theme);
  } catch {
    /* ignore */
  }
  syncToggle();
};

toggle?.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
  setTheme(next);
});

syncToggle();

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
