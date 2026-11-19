const sheet = document.querySelector("[data-animate]");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
