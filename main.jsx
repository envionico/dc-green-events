import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// --- Progressive Web App: register the service worker -------------------
// This enables offline support and "Add to Home Screen". It only runs on a
// real hosted site (https), not from a double-clicked local file, and it
// fails silently if the browser doesn't support it — so it never breaks the
// app. The file lives at /sw.js (in the public/ folder).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + "sw.js").catch(() => {
      /* service worker registration failed — app still works normally */
    });
  });
}
