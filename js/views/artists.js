// View: Artists Directory
import { Store } from "../data.js";
import { FilterState, filterAndSortArtists } from "../search.js";
import { Favorites } from "../utils.js";
import { Icons } from "../components/icons.js";
import { openArtistModal, openGalleryLightbox } from "./modal.js";
import { showToast } from "../components/toast.js";

let currentLayout = "grid"; // "grid" | "compact"

export function renderArtistsView(container) {
  const allArtists = Store.getArtistsForCurrentCon();
  const filteredArtists = filterAndSortArtists(allArtists);

  container.innerHTML = `
    <!-- Active Filter Strip -->
    <div class="filter-strip" id="activeFilterStrip">
      ${renderActiveFilterChips()}
    </div>

    <!-- View Controls Header -->
    <div class="view-header">
      <div class="view-title-group">
        <h2 class="view-title">Artists & Circles</h2>
        <span class="view-count">${filteredArtists.length} of ${allArtists.length} artists</span>
      </div>

      <div class="view-controls">
        <select class="sort-select" id="artistSortSelect" aria-label="Sort options">
          <option value="booth" ${FilterState.sortBy === "booth" ? "selected" : ""}>Sort: Booth (A-Z)</option>
          <option value="name" ${FilterState.sortBy === "name" ? "selected" : ""}>Sort: Name (A-Z)</option>
          <option value="catalogs" ${FilterState.sortBy === "catalogs" ? "selected" : ""}>Sort: Most Catalogs</option>
          <option value="popular" ${FilterState.sortBy === "popular" ? "selected" : ""}>Sort: Favorited</option>
        </select>

        <div class="layout-toggle" role="group" aria-label="Layout toggle">
          <button class="layout-btn ${currentLayout === "grid" ? "active" : ""}" id="btnLayoutGrid" title="Visual Grid View">
            ${Icons.grid}
          </button>
          <button class="layout-btn ${currentLayout === "compact" ? "active" : ""}" id="btnLayoutCompact" title="Compact List View">
            ${Icons.rows}
          </button>
        </div>
      </div>
    </div>

    <!-- Artists Grid / List -->
    <div class="artists-grid ${currentLayout === "compact" ? "layout-compact" : ""}" id="artistsGrid">
      ${filteredArtists.length > 0 ? filteredArtists.map(artist => renderArtistCard(artist)).join("") : renderEmptyState()}
    </div>
  `;

  attachArtistsEvents(container);
}

function renderActiveFilterChips() {
  const chips = [];

  if (FilterState.query) {
    chips.push(`
      <span class="filter-chip active" data-action="clear-query">
        Search: "${escapeHtml(FilterState.query)}" <span class="filter-chip-remove">&times;</span>
      </span>
    `);
  }

  if (FilterState.favoritesOnly) {
    chips.push(`
      <span class="filter-chip active" data-action="toggle-favorites">
        ♥ Favorites Only <span class="filter-chip-remove">&times;</span>
      </span>
    `);
  }

  for (const s of FilterState.selectedSeries) {
    chips.push(`
      <span class="filter-chip active" data-action="remove-series" data-value="${escapeHtml(s)}">
        Series: ${escapeHtml(s)} <span class="filter-chip-remove">&times;</span>
      </span>
    `);
  }

  for (const m of FilterState.selectedMerch) {
    chips.push(`
      <span class="filter-chip active" data-action="remove-merch" data-value="${escapeHtml(m)}">
        Merch: ${escapeHtml(m)} <span class="filter-chip-remove">&times;</span>
      </span>
    `);
  }

  if (FilterState.hasCatalogsOnly) {
    chips.push(`<span class="filter-chip active" data-action="toggle-catalogs">Has Catalogs <span class="filter-chip-remove">&times;</span></span>`);
  }
  if (FilterState.commissionsOnly) {
    chips.push(`<span class="filter-chip active" data-action="toggle-commissions">Commissions Open <span class="filter-chip-remove">&times;</span></span>`);
  }
  if (FilterState.verifiedOnly) {
    chips.push(`<span class="filter-chip active" data-action="toggle-verified">Verified Only <span class="filter-chip-remove">&times;</span></span>`);
  }
  if (FilterState.newOnly) {
    chips.push(`<span class="filter-chip active" data-action="toggle-new">New Artists <span class="filter-chip-remove">&times;</span></span>`);
  }

  if (chips.length > 0) {
    chips.push(`
      <button class="filter-chip" data-action="reset-all" style="color: var(--primary);">
        Clear All
      </button>
    `);
    return chips.join("");
  }

  return `
    <span class="filter-chip" data-action="filter-favorites">♥ Favorites</span>
    <span class="filter-chip" data-action="filter-catalogs">With Catalogs</span>
    <span class="filter-chip" data-action="filter-commissions">Commissions Open</span>
    <span class="filter-chip" data-action="filter-new">New Artists</span>
  `;
}

function renderArtistCard(artist) {
  const isFav = Favorites.has(artist.id);
  const images = artist.images || [];

  return `
    <article class="artist-card" data-id="${artist.id}">
      <div class="artist-card-header">
        <img class="artist-avatar" src="${escapeHtml(artist.profileImage || './assets/icons/favicon.svg')}" alt="${escapeHtml(artist.name)}" loading="lazy" onerror="this.src='./assets/icons/favicon.svg'"/>
        
        <div class="artist-header-info">
          <div class="artist-booth-row">
            <span class="booth-badge">${escapeHtml(artist.booth || "TBA")}</span>
            ${artist.verified ? `<span class="badge-tag badge-verified">Verified</span>` : ""}
            ${artist.isNew ? `<span class="badge-tag badge-new">New</span>` : ""}
            ${artist.commissions && !artist.commissions.toLowerCase().includes("closed") ? `<span class="badge-tag badge-commission">Commissions</span>` : ""}
          </div>
          <h3 class="artist-name">${escapeHtml(artist.name)}</h3>
        </div>

        <button class="btn-favorite ${isFav ? "active" : ""}" data-id="${artist.id}" title="${isFav ? "Remove from favorites" : "Add to favorites"}" aria-label="Favorite artist">
          ${Icons.heart}
        </button>
      </div>

      <div class="artist-card-body">
        ${artist.summary ? `<p class="artist-summary">${escapeHtml(artist.summary)}</p>` : ""}

        ${images.length > 0 ? `
          <div class="artist-card-images">
            ${images.slice(0, 3).map((img, idx) => `
              <img class="card-img-thumb" src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption || artist.name)}" loading="lazy" data-artist-id="${escapeHtml(artist.id)}" data-img-index="${idx}" title="Zoom image preview"/>
            `).join("")}
          </div>
        ` : ""}

        <div class="artist-card-tags">
          ${(artist.series || []).slice(0, 3).map(s => `
            <span class="tag-pill series-tag" data-series="${escapeHtml(s)}">${escapeHtml(s)}</span>
          `).join("")}
          ${(artist.merch || []).slice(0, 3).map(m => `
            <span class="tag-pill merch-tag" data-merch="${escapeHtml(m)}">${escapeHtml(m)}</span>
          `).join("")}
          ${((artist.series || []).length + (artist.merch || []).length > 6) ? `
            <span class="tag-pill">+more</span>
          ` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderEmptyState() {
  return `
    <div class="empty-state">
      <div class="empty-icon">${Icons.search}</div>
      <h3 class="empty-title">No artists found</h3>
      <p class="empty-desc">No artists matched your current search and filter criteria. Try clearing some filters or searching with different keywords.</p>
      <button class="btn-primary" id="btnResetFiltersEmpty">Reset Filters</button>
    </div>
  `;
}

function attachArtistsEvents(container) {
  // Direct thumbnail click -> open full-screen gallery lightbox
  container.querySelectorAll(".card-img-thumb").forEach(thumb => {
    thumb.addEventListener("click", e => {
      e.stopPropagation();
      const artistId = thumb.dataset.artistId;
      const imgIndex = parseInt(thumb.dataset.imgIndex, 10) || 0;
      const artist = Store.getArtistById(artistId);
      if (artist && artist.images && artist.images.length > 0) {
        openGalleryLightbox(artist.images, imgIndex, artist.name);
      }
    });
  });

  // Card click -> open detail modal
  container.querySelectorAll(".artist-card").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest(".btn-favorite") || e.target.closest(".tag-pill") || e.target.closest(".card-img-thumb")) return;
      const artistId = card.dataset.id;
      openArtistModal(artistId);
    });
  });

  // Favorite button click
  container.querySelectorAll(".btn-favorite").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const artistId = btn.dataset.id;
      const added = Favorites.toggle(artistId);
      btn.classList.toggle("active", added);
      showToast(added ? "Added to favorites ♥" : "Removed from favorites");
    });
  });

  // Tag click -> instant filter
  container.querySelectorAll(".series-tag").forEach(tag => {
    tag.addEventListener("click", e => {
      e.stopPropagation();
      const s = tag.dataset.series;
      if (s) {
        FilterState.selectedSeries.add(s);
        renderArtistsView(container);
      }
    });
  });

  container.querySelectorAll(".merch-tag").forEach(tag => {
    tag.addEventListener("click", e => {
      e.stopPropagation();
      const m = tag.dataset.merch;
      if (m) {
        FilterState.selectedMerch.add(m);
        renderArtistsView(container);
      }
    });
  });

  // Active filter strip actions
  const strip = container.querySelector("#activeFilterStrip");
  if (strip) {
    strip.addEventListener("click", e => {
      const chip = e.target.closest("[data-action]");
      if (!chip) return;
      const action = chip.dataset.action;

      if (action === "clear-query") {
        FilterState.query = "";
        const searchInput = document.getElementById("headerSearchInput");
        if (searchInput) searchInput.value = "";
      } else if (action === "toggle-favorites" || action === "filter-favorites") {
        FilterState.favoritesOnly = !FilterState.favoritesOnly;
      } else if (action === "toggle-catalogs" || action === "filter-catalogs") {
        FilterState.hasCatalogsOnly = !FilterState.hasCatalogsOnly;
      } else if (action === "toggle-commissions" || action === "filter-commissions") {
        FilterState.commissionsOnly = !FilterState.commissionsOnly;
      } else if (action === "toggle-verified") {
        FilterState.verifiedOnly = !FilterState.verifiedOnly;
      } else if (action === "toggle-new" || action === "filter-new") {
        FilterState.newOnly = !FilterState.newOnly;
      } else if (action === "remove-series") {
        FilterState.selectedSeries.delete(chip.dataset.value);
      } else if (action === "remove-merch") {
        FilterState.selectedMerch.delete(chip.dataset.value);
      } else if (action === "reset-all") {
        FilterState.reset();
        const searchInput = document.getElementById("headerSearchInput");
        if (searchInput) searchInput.value = "";
      }

      renderArtistsView(container);
      updateFilterBadge();
    });
  }

  // Sort select change
  const sortSelect = container.querySelector("#artistSortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      FilterState.sortBy = sortSelect.value;
      renderArtistsView(container);
    });
  }

  // Layout toggle
  const btnGrid = container.querySelector("#btnLayoutGrid");
  const btnCompact = container.querySelector("#btnLayoutCompact");

  if (btnGrid) {
    btnGrid.addEventListener("click", () => {
      currentLayout = "grid";
      renderArtistsView(container);
    });
  }

  if (btnCompact) {
    btnCompact.addEventListener("click", () => {
      currentLayout = "compact";
      renderArtistsView(container);
    });
  }

  // Reset empty button
  const btnReset = container.querySelector("#btnResetFiltersEmpty");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      FilterState.reset();
      const searchInput = document.getElementById("headerSearchInput");
      if (searchInput) searchInput.value = "";
      renderArtistsView(container);
      updateFilterBadge();
    });
  }
}

export function updateFilterBadge() {
  const badge = document.getElementById("filterBadge");
  if (!badge) return;
  const count = FilterState.getActiveFilterCount();
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
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
