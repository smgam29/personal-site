const sheet = document.querySelector("[data-animate]");

const reveal = () => {
  requestAnimationFrame(() => {
    sheet?.classList.add("is-ready");
  });
};

if (document.fonts?.ready) {
  document.fonts.ready.then(reveal).catch(reveal);
} else {
  reveal();
}
