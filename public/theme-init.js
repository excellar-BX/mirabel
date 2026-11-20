// Applies the saved theme before first paint (avoids a light/dark flash).
try {
  var t = localStorage.getItem("mirabel-theme");
  if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
} catch (e) {
  /* storage unavailable */
}
