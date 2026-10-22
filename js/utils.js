// Utility Functions
const FAVORITES_KEY = "trackside_favorites";
const THEME_KEY = "trackside_theme";

// --- Favorites Manager ---
export const Favorites = {
  getAll() {
    try {
      const data = localStorage.getItem(FAVORITES_KEY);
      return data ? new Set(JSON.parse(data)) : new Set();
    } catch {
      return new Set();
    }
  },

  has(id) {
    return this.getAll().has(id);
  },

  toggle(id) {
    const favs = this.getAll();
    let isAdded = false;
    if (favs.has(id)) {
      favs.delete(id);
      isAdded = false;
    } else {
      favs.add(id);
      isAdded = true;
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
    window.dispatchEvent(new CustomEvent("favorites-changed", { detail: { id, isAdded } }));
    return isAdded;
  },

  clear() {
    localStorage.removeItem(FAVORITES_KEY);
    window.dispatchEvent(new CustomEvent("favorites-changed", { detail: { cleared: true } }));
  },

  exportJSON() {
    const favs = [...this.getAll()];
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), favorites: favs }, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trackside-favorites-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      const list = Array.isArray(parsed) ? parsed : (parsed.favorites || []);
      const current = this.getAll();
      list.forEach(id => current.add(id));
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...current]));
      window.dispatchEvent(new CustomEvent("favorites-changed", { detail: { imported: true } }));
      return list.length;
    } catch (e) {
      console.error("Failed to import favorites JSON", e);
      throw e;
    }
  }
};

// --- Theme Manager ---
export const Theme = {
  get() {
    return localStorage.getItem(THEME_KEY) || "dark";
  },

  set(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", theme === "light" ? "#740007" : "#EE3C35");
    }
  },

  toggle() {
    const current = this.get();
    const next = current === "dark" ? "light" : "dark";
    this.set(next);
    return next;
  },

  init() {
    this.set(this.get());
  }
};

// --- Booth Natural Sorting ---
// Compares booths like 'A01', 'A02', 'A10', 'B01', 'B20' correctly
export function compareBooths(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const matchA = a.match(/^([A-Za-z]+)(\d+)?/);
  const matchB = b.match(/^([A-Za-z]+)(\d+)?/);

  if (!matchA || !matchB) return a.localeCompare(b);

  const prefixA = matchA[1].toUpperCase();
  const prefixB = matchB[1].toUpperCase();

  if (prefixA !== prefixB) {
    return prefixA.localeCompare(prefixB);
  }

  const numA = parseInt(matchA[2] || "0", 10);
  const numB = parseInt(matchB[2] || "0", 10);

  return numA - numB;
}

// --- URL Params Helper ---
export function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    tab: params.get("tab") || "artists",
    con: params.get("con") || "",
    artist: params.get("artist") || "",
    series: params.get("series") || "",
    merch: params.get("merch") || "",
    booth: params.get("booth") || "",
    search: params.get("search") || ""
  };
}

export function updateUrlParam(key, value) {
  const url = new URL(window.location.href);
  if (value) {
    url.searchParams.set(key, value);
  } else {
    url.searchParams.delete(key);
  }
  window.history.replaceState({}, "", url.toString());
}
