// Application Entry Point & Router
import { Store } from "./data.js";
import { FilterState } from "./search.js";
import { Theme, Favorites, getUrlParams, updateUrlParam } from "./utils.js";
import { Icons } from "./components/icons.js";
import { renderArtistsView, updateFilterBadge } from "./views/artists.js";
import { renderBrowseView } from "./views/browse.js";
import { renderFavoritesView } from "./views/favorites.js";
import { renderMapView } from "./views/map.js";
import { renderRalliesView } from "./views/rallies.js";
import { initModals, openFilterDrawer, openArtistModal } from "./views/modal.js";

let currentTab = "artists";

// DOM View Containers
const views = {
  artists: null,
  browse: null,
  favorites: null,
  map: null,
  rallies: null
};

export async function initApp() {
  Theme.init();

  // Populate view container references
  views.artists = document.getElementById("artistsView");
  views.browse = document.getElementById("browseView");
  views.favorites = document.getElementById("favoritesView");
  views.map = document.getElementById("mapView");
  views.rallies = document.getElementById("ralliesView");

  initModals();

  // Load Data
  const success = await Store.loadAll();
  if (!success) {
    views.artists.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-title">Error Loading Catalog</h3>
        <p class="empty-desc">Could not load the catalog database. Please check your network connection and reload.</p>
      </div>
    `;
    return;
  }

  // Populate Convention Dropdown
  setupConventionSelector();

  // Attach Navigation Listeners
  setupNavigation();

  // Attach Header Search & Filters
  setupHeaderControls();

  // Check initial URL parameters
  const params = getUrlParams();
  if (params.con && Store.conventions.some(c => c.id === params.con)) {
    Store.setConvention(params.con);
    const conSelect = document.getElementById("conSelect");
    if (conSelect) conSelect.value = params.con;
  }

  if (params.series) {
    FilterState.selectedSeries.add(params.series);
  }
  if (params.merch) {
    FilterState.selectedMerch.add(params.merch);
  }
  if (params.search) {
    FilterState.query = params.search;
    const searchInput = document.getElementById("headerSearchInput");
    if (searchInput) searchInput.value = params.search;
  }

  // Determine initial tab
  const validTabs = ["artists", "browse", "favorites", "map", "rallies"];
  const targetTab = validTabs.includes(params.tab) ? params.tab : "artists";
  switchTab(targetTab, { targetBooth: params.booth });

  // If specific artist requested in URL, open modal
  if (params.artist) {
    setTimeout(() => {
      openArtistModal(params.artist);
    }, 200);
  }

  // Register PWA Service Worker
  registerServiceWorker();

  // Re-render when favorites change
  window.addEventListener("favorites-changed", () => {
    if (currentTab === "artists") renderArtistsView(views.artists);
    if (currentTab === "favorites") renderFavoritesView(views.favorites);
  });
}

function setupConventionSelector() {
  const conSelect = document.getElementById("conSelect");
  if (!conSelect) return;

  conSelect.innerHTML = Store.conventions.map(c => `
    <option value="${c.id}" ${c.id === Store.currentConventionId ? "selected" : ""}>
      ${c.shortName || c.name}
    </option>
  `).join("");

  conSelect.addEventListener("change", () => {
    Store.setConvention(conSelect.value);
    updateUrlParam("con", conSelect.value);
    switchTab(currentTab);
  });
}

function setupNavigation() {
  // Desktop Nav Tabs
  document.querySelectorAll(".desktop-nav .nav-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  // Mobile Bottom Nav Items
  document.querySelectorAll(".bottom-nav .mobile-nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const tab = item.dataset.tab;
      if (tab) switchTab(tab);
    });
  });
}

export function switchTab(tabName, options = {}) {
  currentTab = tabName;
  updateUrlParam("tab", tabName === "artists" ? "" : tabName);

  // Update active state in navigation
  document.querySelectorAll("[data-tab]").forEach(el => {
    el.classList.toggle("active", el.dataset.tab === tabName);
  });

  // Hide all views, display active view
  Object.keys(views).forEach(k => {
    if (views[k]) {
      views[k].classList.toggle("active", k === tabName);
    }
  });

  // Render view content
  switch (tabName) {
    case "artists":
      renderArtistsView(views.artists);
      break;
    case "browse":
      renderBrowseView(views.browse);
      break;
    case "favorites":
      renderFavoritesView(views.favorites);
      break;
    case "map":
      renderMapView(views.map, options);
      break;
    case "rallies":
      renderRalliesView(views.rallies);
      break;
  }

  // Scroll to top on view change
  window.scrollTo({ top: 0, behavior: "instant" });
}

function setupHeaderControls() {
  const searchInput = document.getElementById("headerSearchInput");
  const clearBtn = document.getElementById("headerSearchClear");
  const filterBtn = document.getElementById("headerFilterBtn");
  const themeBtn = document.getElementById("headerThemeBtn");

  // Real-time search with debounce
  let debounceTimeout = null;
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      const val = e.target.value;
      clearBtn.classList.toggle("visible", val.length > 0);

      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        FilterState.query = val;
        updateUrlParam("search", val);

        if (currentTab !== "artists" && currentTab !== "map") {
          switchTab("artists");
        } else {
          if (currentTab === "artists") renderArtistsView(views.artists);
          if (currentTab === "map") renderMapView(views.map);
        }
      }, 150);
    });

    // Keyboard shortcut '/' to search
    window.addEventListener("keydown", e => {
      if (e.key === "/" && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearBtn.classList.remove("visible");
      FilterState.query = "";
      updateUrlParam("search", "");
      if (currentTab === "artists") renderArtistsView(views.artists);
      if (currentTab === "map") renderMapView(views.map);
    });
  }

  if (filterBtn) {
    filterBtn.addEventListener("click", openFilterDrawer);
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const nextTheme = Theme.toggle();
      themeBtn.innerHTML = nextTheme === "light" ? Icons.moon : Icons.sun;
    });
  }

  updateFilterBadge();
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("Service Worker registered successfully."))
      .catch(err => console.log("Service Worker registration skipped:", err));
  }
}

// Auto-run bootstrap on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
