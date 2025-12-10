// app.js – registro del Service Worker

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((err) => {
        console.error("SW registration failed:", err);
      });
  });
}
