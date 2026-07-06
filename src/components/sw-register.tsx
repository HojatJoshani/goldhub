"use client";

import * as React from "react";

/**
 * Registers the service worker for PWA functionality
 * Must be a client component
 */
export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log("[PWA] SW registered successfully:", registration.scope);
          })
          .catch((err) => {
            console.error("[PWA] SW registration failed:", err);
          });
      });
    } else if ("serviceWorker" in navigator && process.env.NODE_ENV === "development") {
      // Also register in dev for testing (optional)
      // Uncomment to test in dev
      // navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
