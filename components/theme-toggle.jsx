"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "hackathon-judge-theme";

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

function readTheme() {
  return (
    window.localStorage.getItem(STORAGE_KEY) ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}

// External store so the theme is read from the browser (localStorage / system
// preference) without a hydration mismatch: getServerSnapshot returns null on
// the server + first client render, then the real theme resolves after mount.
function subscribe(callback) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => null);
  const mounted = theme !== null;

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    // Notify subscribers so useSyncExternalStore re-reads the new value.
    window.dispatchEvent(new Event("storage"));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"
      }
      className="inline-flex size-10 items-center justify-center rounded-full border border-border-subtle bg-surface-card text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-bright"
    >
      {/* Render nothing until mounted so the first client render matches the
          server (which has no access to the persisted theme). */}
      {!mounted ? (
        <span className="size-4" />
      ) : theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </button>
  );
}
