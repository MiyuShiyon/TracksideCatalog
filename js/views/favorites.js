// View: Favorites Management
import { Store } from "../data.js";
import { Favorites } from "../utils.js";
import { Icons } from "../components/icons.js";
import { openArtistModal } from "./modal.js";
import { switchTab } from "../app.js";
import { showToast } from "../components/toast.js";

export function renderFavoritesView(container) {
  const allArtists = Store.getArtistsForCurrentCon();
  const favIds = Favorites.getAll();
  const favoriteArtists = allArtists.filter(a => favIds.has(a.id));

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2 class="view-title">Favorited Artists</h2>
        <span class="view-count">${favoriteArtists.length} saved for this con</span>
      </div>

      <div class="view-controls">
        <button class="btn-secondary" id="btnExportFavs" title="Export favorites as JSON">
          ${Icons.download} Export
        </button>
        <button class="btn-secondary" id="btnImportFavs" title="Import favorites JSON">
          ${Icons.upload} Import
        </button>
        ${favoriteArtists.length > 0 ? `
          <button class="btn-primary" id="btnViewFavsOnMap">
            ${Icons.map} View on Map
          </button>
        ` : ""}
      </div>
    </div>

    <!-- Hidden File Input for Import -->
    <input type="file" id="importFavsFileInput" accept=".json" style="display: none;" />

    <div class="artists-grid" id="favoritesGrid">
      ${favoriteArtists.length > 0 ? favoriteArtists.map(artist => renderFavoriteCard(artist)).join("") : renderEmptyFavoritesState()}
    </div>
  `;

  attachFavoritesEvents(container);
}

function renderFavoriteCard(artist) {
  return `
    <article class="artist-card" data-id="${artist.id}">
      <div class="artist-card-header">
        <img class="artist-avatar" src="${escapeHtml(artist.profileImage || './assets/icons/favicon.svg')}" alt="${escapeHtml(artist.name)}" loading="lazy" onerror="this.src='./assets/icons/favicon.svg'"/>
        
        <div class="artist-header-info">
          <div class="artist-booth-row">
            <span class="booth-badge">${escapeHtml(artist.booth || "TBA")}</span>
            ${artist.verified ? `<span class="badge-tag badge-verified">Verified</span>` : ""}
          </div>
          <h3 class="artist-name">${escapeHtml(artist.name)}</h3>
        </div>

        <button class="btn-favorite active" data-id="${artist.id}" title="Remove from favorites" aria-label="Favorite artist">
          ${Icons.heart}
        </button>
      </div>

      <div class="artist-card-body">
        ${artist.summary ? `<p class="artist-summary">${escapeHtml(artist.summary)}</p>` : ""}

        <div class="artist-card-tags">
          ${(artist.series || []).slice(0, 3).map(s => `
            <span class="tag-pill series-tag">${escapeHtml(s)}</span>
          `).join("")}
          ${(artist.merch || []).slice(0, 3).map(m => `
            <span class="tag-pill merch-tag">${escapeHtml(m)}</span>
          `).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderEmptyFavoritesState() {
  return `
    <div class="empty-state">
      <div class="empty-icon" style="color: var(--primary);">${Icons.heart}</div>
      <h3 class="empty-title">No favorites saved yet</h3>
      <p class="empty-desc">Tap the heart icon on any artist card to bookmark your favorite circles and tables for easy reference during the convention!</p>
      <button class="btn-primary" id="btnBrowseFromFavs">Explore Artists</button>
    </div>
  `;
}

function attachFavoritesEvents(container) {
  // Card click -> open detail modal
  container.querySelectorAll(".artist-card").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest(".btn-favorite")) return;
      openArtistModal(card.dataset.id);
    });
  });

  // Favorite button click (remove)
  container.querySelectorAll(".btn-favorite").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      Favorites.toggle(id);
      showToast("Removed from favorites");
      renderFavoritesView(container);
    });
  });

  // Export JSON
  const btnExport = container.querySelector("#btnExportFavs");
  if (btnExport) {
    btnExport.addEventListener("click", () => {
      Favorites.exportJSON();
      showToast("Favorites exported successfully!");
    });
  }

  // Import JSON
  const btnImport = container.querySelector("#btnImportFavs");
  const fileInput = container.querySelector("#importFavsFileInput");

  if (btnImport && fileInput) {
    btnImport.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const count = Favorites.importJSON(ev.target.result);
          showToast(`Imported ${count} favorites!`);
          renderFavoritesView(container);
        } catch {
          showToast("Invalid favorites file format.");
        }
      };
      reader.readAsText(file);
    });
  }

  // View on Map
  const btnViewOnMap = container.querySelector("#btnViewFavsOnMap");
  if (btnViewOnMap) {
    btnViewOnMap.addEventListener("click", () => {
      switchTab("map", { highlightFavorites: true });
    });
  }

  // Explore button in empty state
  const btnBrowse = container.querySelector("#btnBrowseFromFavs");
  if (btnBrowse) {
    btnBrowse.addEventListener("click", () => {
      switchTab("artists");
    });
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
