// View: Browse by Series or Merchandise
import { Store } from "../data.js";
import { FilterState } from "../search.js";
import { switchTab } from "../app.js";

let activeBrowseTab = "series"; // "series" | "merch"
let browseSearchQuery = "";

export function renderBrowseView(container) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2 class="view-title">Browse Directory</h2>
        <span class="view-count">Explore by fandom or merchandise type</span>
      </div>

      <div class="view-controls">
        <div class="layout-toggle" role="tablist">
          <button class="nav-tab-btn ${activeBrowseTab === "series" ? "active" : ""}" id="tabBrowseSeries">
            Series &amp; Fandoms
          </button>
          <button class="nav-tab-btn ${activeBrowseTab === "merch" ? "active" : ""}" id="tabBrowseMerch">
            Merchandise Types
          </button>
        </div>
      </div>
    </div>

    <!-- Browse Search Bar -->
    <div style="margin-bottom: 20px;">
      <div class="search-input-wrap" style="max-width: 480px;">
        <input type="text" class="search-input" id="browseSearchInput" placeholder="Filter ${activeBrowseTab === "series" ? "series or fandoms" : "merchandise types"}..." value="${escapeHtml(browseSearchQuery)}">
      </div>
    </div>

    <!-- Items Grid -->
    <div id="browseItemsContainer">
      ${activeBrowseTab === "series" ? renderSeriesList() : renderMerchList()}
    </div>
  `;

  attachBrowseEvents(container);
}

function renderSeriesList() {
  const q = browseSearchQuery.trim().toLowerCase();
  let seriesList = [...Store.seriesSet];

  if (q) {
    seriesList = seriesList.filter(s => s.toLowerCase().includes(q));
  }

  // Sort by popularity (artist count descending), then name
  seriesList.sort((a, b) => {
    const countA = Store.seriesCounts.get(a) || 0;
    const countB = Store.seriesCounts.get(b) || 0;
    return countB - countA || a.localeCompare(b);
  });

  if (seriesList.length === 0) {
    return `<div class="empty-state"><p class="empty-desc">No series matched your search.</p></div>`;
  }

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px;">
      ${seriesList.map(series => {
        const count = Store.seriesCounts.get(series) || 0;
        return `
          <div class="artist-card" style="padding: 14px 18px; display: flex; flex-direction: row; align-items: center; justify-content: space-between;" data-series="${escapeHtml(series)}">
            <span style="font-weight: 700; color: var(--text-heading); font-size: 15px;">${escapeHtml(series)}</span>
            <span class="booth-badge" style="background-color: rgba(var(--primary-rgb), 0.15); color: var(--primary);">${count} artist${count === 1 ? "" : "s"}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderMerchList() {
  const q = browseSearchQuery.trim().toLowerCase();
  let merchList = [...Store.merchSet];

  if (q) {
    merchList = merchList.filter(m => m.toLowerCase().includes(q));
  }

  merchList.sort((a, b) => {
    const countA = Store.merchCounts.get(a) || 0;
    const countB = Store.merchCounts.get(b) || 0;
    return countB - countA || a.localeCompare(b);
  });

  if (merchList.length === 0) {
    return `<div class="empty-state"><p class="empty-desc">No merchandise types matched your search.</p></div>`;
  }

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px;">
      ${merchList.map(merch => {
        const count = Store.merchCounts.get(merch) || 0;
        return `
          <div class="artist-card" style="padding: 14px 18px; display: flex; flex-direction: row; align-items: center; justify-content: space-between;" data-merch="${escapeHtml(merch)}">
            <span style="font-weight: 700; color: var(--text-heading); font-size: 15px;">${escapeHtml(merch)}</span>
            <span class="booth-badge" style="background-color: rgba(118, 237, 255, 0.15); color: var(--tertiary);">${count} artist${count === 1 ? "" : "s"}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function attachBrowseEvents(container) {
  const tabSeries = container.querySelector("#tabBrowseSeries");
  const tabMerch = container.querySelector("#tabBrowseMerch");
  const searchInput = container.querySelector("#browseSearchInput");

  if (tabSeries) {
    tabSeries.addEventListener("click", () => {
      activeBrowseTab = "series";
      browseSearchQuery = "";
      renderBrowseView(container);
    });
  }

  if (tabMerch) {
    tabMerch.addEventListener("click", () => {
      activeBrowseTab = "merch";
      browseSearchQuery = "";
      renderBrowseView(container);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", e => {
      browseSearchQuery = e.target.value;
      const itemsContainer = container.querySelector("#browseItemsContainer");
      if (itemsContainer) {
        itemsContainer.innerHTML = activeBrowseTab === "series" ? renderSeriesList() : renderMerchList();
        attachCardClickEvents(itemsContainer);
      }
    });
  }

  attachCardClickEvents(container);
}

function attachCardClickEvents(container) {
  container.querySelectorAll("[data-series]").forEach(el => {
    el.addEventListener("click", () => {
      const s = el.dataset.series;
      if (s) {
        FilterState.reset();
        FilterState.selectedSeries.add(s);
        switchTab("artists");
      }
    });
  });

  container.querySelectorAll("[data-merch]").forEach(el => {
    el.addEventListener("click", () => {
      const m = el.dataset.merch;
      if (m) {
        FilterState.reset();
        FilterState.selectedMerch.add(m);
        switchTab("artists");
      }
    });
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
