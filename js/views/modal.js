// Modal, Drawer & Lightbox Controller
import { Store } from "../data.js";
import { FilterState } from "../search.js";
import { Favorites } from "../utils.js";
import { Icons, getSocialIcon, getSocialLabel } from "../components/icons.js";
import { switchTab } from "../app.js";
import { renderArtistsView, updateFilterBadge } from "./artists.js";
import { showToast } from "../components/toast.js";

let modalBackdrop = null;
let filterBackdrop = null;
let lightboxBackdrop = null;

// Lightbox Gallery State
let currentGallery = [];
let currentGalleryIndex = 0;
let currentGalleryArtistName = "";
let activeImageRequestId = 0;

export function initModals() {
  modalBackdrop = document.getElementById("artistModalBackdrop");
  filterBackdrop = document.getElementById("filterDrawerBackdrop");
  lightboxBackdrop = document.getElementById("lightboxBackdrop");

  // Backdrop close listeners
  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", e => {
      if (e.target === modalBackdrop) closeArtistModal();
    });
  }

  if (filterBackdrop) {
    filterBackdrop.addEventListener("click", e => {
      if (e.target === filterBackdrop) closeFilterDrawer();
    });
  }

  if (lightboxBackdrop) {
    // Click outside image or on close button to close
    lightboxBackdrop.addEventListener("click", e => {
      const isCloseBtn = e.target.closest("#btnLightboxClose");
      const isNavBtn = e.target.closest(".lightbox-nav-btn");
      const isImg = e.target.closest("#lightboxImg");
      const isError = e.target.closest("#lightboxError");

      if (isCloseBtn || (!isNavBtn && !isImg && !isError)) {
        closeLightbox();
      }
    });

    const btnPrev = lightboxBackdrop.querySelector("#btnLightboxPrev");
    if (btnPrev) {
      btnPrev.addEventListener("click", e => {
        e.stopPropagation();
        prevGallerySlide();
      });
    }

    const btnNext = lightboxBackdrop.querySelector("#btnLightboxNext");
    if (btnNext) {
      btnNext.addEventListener("click", e => {
        e.stopPropagation();
        nextGallerySlide();
      });
    }

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchStartY = 0;

    lightboxBackdrop.addEventListener("touchstart", e => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    lightboxBackdrop.addEventListener("touchend", e => {
      if (e.changedTouches && e.changedTouches[0]) {
        const diffX = e.changedTouches[0].clientX - touchStartX;
        const diffY = e.changedTouches[0].clientY - touchStartY;
        // Horizontal swipe detected if deltaX > 40px and dominant over vertical
        if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX < 0) {
            nextGallerySlide();
          } else {
            prevGallerySlide();
          }
        }
      }
    }, { passive: true });
  }

  // Keyboard Navigation
  window.addEventListener("keydown", e => {
    if (lightboxBackdrop && lightboxBackdrop.classList.contains("visible")) {
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        prevGallerySlide();
      } else if (e.key === "ArrowRight") {
        nextGallerySlide();
      }
      return;
    }

    if (e.key === "Escape") {
      closeArtistModal();
      closeFilterDrawer();
    }
  });
}

// ==========================================================================
// Artist Details Modal
// ==========================================================================
export function openArtistModal(artistId) {
  const artist = Store.getArtistById(artistId);
  if (!artist || !modalBackdrop) return;

  const isFav = Favorites.has(artist.id);
  const images = artist.images || [];

  const dialog = modalBackdrop.querySelector(".modal-dialog");
  dialog.innerHTML = `
    <!-- Header -->
    <div class="modal-header">
      <div class="modal-artist-hero">
        <img class="modal-artist-avatar" src="${escapeHtml(artist.profileImage || './assets/icons/favicon.svg')}" alt="${escapeHtml(artist.name)}" onerror="this.src='./assets/icons/favicon.svg'"/>
        
        <div class="modal-artist-info">
          <div class="artist-booth-row">
            <span class="booth-badge">${escapeHtml(artist.booth || "TBA")}</span>
            ${artist.verified ? `<span class="badge-tag badge-verified">Verified Artist</span>` : ""}
            ${artist.isNew ? `<span class="badge-tag badge-new">New Artist</span>` : ""}
          </div>
          <h2 class="modal-artist-title">${escapeHtml(artist.name)}</h2>
        </div>
      </div>

      <div class="modal-header-actions">
        <button class="btn-favorite ${isFav ? "active" : ""}" id="btnModalFav" title="Favorite artist" aria-label="Favorite artist">
          ${Icons.heart}
        </button>
        <button class="modal-close-btn" id="btnModalClose" title="Close modal" aria-label="Close">
          ${Icons.close}
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="modal-body">
      <!-- Summary / Bio -->
      ${artist.summary ? `
        <div>
          <div class="modal-section-title">About the Artist</div>
          <p class="modal-bio-text">${escapeHtml(artist.summary)}</p>
        </div>
      ` : ""}

      <!-- Commissions status -->
      ${artist.commissions ? `
        <div>
          <div class="modal-section-title">🎨 Commissions</div>
          <div class="commission-box">
            ${escapeHtml(artist.commissions)}
          </div>
        </div>
      ` : ""}

      <!-- Social & Store Links -->
      ${renderArtistLinks(artist)}

      <!-- Catalog Gallery -->
      ${images.length > 0 ? `
        <div>
          <div class="modal-section-title">Catalog &amp; Art Previews (${images.length})</div>
          <div class="modal-gallery-grid">
            ${images.map((img, idx) => `
              <div class="gallery-item" data-index="${idx}" title="Zoom image">
                <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption || artist.name)}" loading="lazy"/>
                <div class="gallery-overlay-icon">${Icons.zoomIn}</div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <!-- Series Tags -->
      ${(artist.series || []).length > 0 ? `
        <div>
          <div class="modal-section-title">Fandoms &amp; Series (${artist.series.length})</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${artist.series.map(s => `
              <span class="tag-pill series-tag" data-filter-series="${escapeHtml(s)}">${escapeHtml(s)}</span>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <!-- Merchandise Tags -->
      ${(artist.merch || []).length > 0 ? `
        <div>
          <div class="modal-section-title">Merchandise Items (${artist.merch.length})</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${artist.merch.map(m => `
              <span class="tag-pill merch-tag" data-filter-merch="${escapeHtml(m)}">${escapeHtml(m)}</span>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <!-- Table Notes -->
      ${artist.notes ? `
        <div>
          <div class="modal-section-title">Table Notes &amp; Payment</div>
          <p style="font-size: 13.5px; color: var(--text-muted);">${escapeHtml(artist.notes)}</p>
        </div>
      ` : ""}
    </div>

    <!-- Footer -->
    <div class="modal-footer">
      <button class="btn-secondary" id="btnModalLocateMap">
        ${Icons.mapPin} Locate on Floor Map
      </button>
      <button class="btn-primary" id="btnModalShare">
        ${Icons.share} Share Artist
      </button>
    </div>
  `;

  modalBackdrop.classList.add("visible");
  document.body.style.overflow = "hidden";

  // Attach modal internal events
  const btnClose = dialog.querySelector("#btnModalClose");
  if (btnClose) btnClose.addEventListener("click", closeArtistModal);

  const btnFav = dialog.querySelector("#btnModalFav");
  if (btnFav) {
    btnFav.addEventListener("click", () => {
      const added = Favorites.toggle(artist.id);
      btnFav.classList.toggle("active", added);
      showToast(added ? "Added to favorites ♥" : "Removed from favorites");
    });
  }

  // Gallery click -> lightbox with full gallery sequence
  dialog.querySelectorAll(".gallery-item").forEach(item => {
    item.addEventListener("click", () => {
      const idx = parseInt(item.dataset.index, 10) || 0;
      openGalleryLightbox(images, idx, artist.name);
    });
  });

  // Series/Merch tag clicks inside modal
  dialog.querySelectorAll("[data-filter-series]").forEach(tag => {
    tag.addEventListener("click", () => {
      const s = tag.dataset.filterSeries;
      closeArtistModal();
      FilterState.reset();
      FilterState.selectedSeries.add(s);
      switchTab("artists");
    });
  });

  dialog.querySelectorAll("[data-filter-merch]").forEach(tag => {
    tag.addEventListener("click", () => {
      const m = tag.dataset.filterMerch;
      closeArtistModal();
      FilterState.reset();
      FilterState.selectedMerch.add(m);
      switchTab("artists");
    });
  });

  // Locate on map button
  const btnLocate = dialog.querySelector("#btnModalLocateMap");
  if (btnLocate) {
    btnLocate.addEventListener("click", () => {
      closeArtistModal();
      switchTab("map", { targetBooth: artist.booth });
    });
  }

  // Share button
  const btnShare = dialog.querySelector("#btnModalShare");
  if (btnShare) {
    btnShare.addEventListener("click", () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}?artist=${encodeURIComponent(artist.id)}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        showToast("Link copied to clipboard!");
      } else {
        showToast(shareUrl);
      }
    });
  }
}

export function closeArtistModal() {
  if (!modalBackdrop) return;
  modalBackdrop.classList.remove("visible");
  document.body.style.overflow = "";
}

function renderArtistLinks(artist) {
  const allSocial = [...(artist.socialLinks || []), ...(artist.catalogLinks || [])];
  const allStores = artist.storeLinks || [];

  if (allSocial.length === 0 && allStores.length === 0) return "";

  return `
    <div>
      <div class="modal-section-title">Links &amp; Online Portfolios</div>
      <div class="social-links-grid">
        ${allSocial.map(link => `
          <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="social-link-btn">
            <span class="social-link-icon">${getSocialIcon(link)}</span>
            <span>${escapeHtml(getSocialLabel(link))}</span>
            ${Icons.externalLink}
          </a>
        `).join("")}
        ${allStores.map(link => `
          <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="social-link-btn" style="border-color: rgba(118, 237, 255, 0.3);">
            <span class="social-link-icon">${Icons.store}</span>
            <span>${escapeHtml(getSocialLabel(link))}</span>
            ${Icons.externalLink}
          </a>
        `).join("")}
      </div>
    </div>
  `;
}

// ==========================================================================
// Filter Drawer
// ==========================================================================
export function openFilterDrawer() {
  if (!filterBackdrop) return;

  const drawer = filterBackdrop.querySelector(".filter-drawer");
  const seriesList = [...Store.seriesSet].sort();
  const merchList = [...Store.merchSet].sort();

  drawer.innerHTML = `
    <div class="filter-drawer-header">
      <h3 class="filter-drawer-title">Filter Directory</h3>
      <button class="modal-close-btn" id="btnFilterClose">
        ${Icons.close}
      </button>
    </div>

    <div class="filter-drawer-body">
      <!-- Quick Toggles -->
      <div>
        <div class="filter-group-title">Quick Filters</div>
        <div class="filter-toggle-list">
          <div class="filter-toggle-row ${FilterState.favoritesOnly ? "active" : ""}" id="toggleDrawerFavs">
            <span class="filter-toggle-label">♥ Favorited Artists</span>
            <div class="custom-checkbox">${FilterState.favoritesOnly ? Icons.check : ""}</div>
          </div>
          <div class="filter-toggle-row ${FilterState.hasCatalogsOnly ? "active" : ""}" id="toggleDrawerCatalogs">
            <span class="filter-toggle-label">Has Catalog / Art Previews</span>
            <div class="custom-checkbox">${FilterState.hasCatalogsOnly ? Icons.check : ""}</div>
          </div>
          <div class="filter-toggle-row ${FilterState.commissionsOnly ? "active" : ""}" id="toggleDrawerCommissions">
            <span class="filter-toggle-label">🎨 Taking Commissions</span>
            <div class="custom-checkbox">${FilterState.commissionsOnly ? Icons.check : ""}</div>
          </div>
          <div class="filter-toggle-row ${FilterState.verifiedOnly ? "active" : ""}" id="toggleDrawerVerified">
            <span class="filter-toggle-label">Verified Artists Only</span>
            <div class="custom-checkbox">${FilterState.verifiedOnly ? Icons.check : ""}</div>
          </div>
          <div class="filter-toggle-row ${FilterState.newOnly ? "active" : ""}" id="toggleDrawerNew">
            <span class="filter-toggle-label">New Artists (First Con)</span>
            <div class="custom-checkbox">${FilterState.newOnly ? Icons.check : ""}</div>
          </div>
        </div>
      </div>

      <!-- Fandoms / Series Filter -->
      <div>
        <div class="filter-group-title">Fandoms &amp; Series (${FilterState.selectedSeries.size} selected)</div>
        <input type="text" class="filter-search-box" id="drawerSeriesSearch" placeholder="Search fandoms...">
        <div class="filter-chips-cloud" id="drawerSeriesCloud">
          ${seriesList.map(s => {
            const isSel = FilterState.selectedSeries.has(s);
            return `
              <span class="filter-chip ${isSel ? "active" : ""}" data-drawer-series="${escapeHtml(s)}">
                ${escapeHtml(s)}
              </span>
            `;
          }).join("")}
        </div>
      </div>

      <!-- Merch Types Filter -->
      <div>
        <div class="filter-group-title">Merchandise Items (${FilterState.selectedMerch.size} selected)</div>
        <input type="text" class="filter-search-box" id="drawerMerchSearch" placeholder="Search merchandise...">
        <div class="filter-chips-cloud" id="drawerMerchCloud">
          ${merchList.map(m => {
            const isSel = FilterState.selectedMerch.has(m);
            return `
              <span class="filter-chip ${isSel ? "active" : ""}" data-drawer-merch="${escapeHtml(m)}">
                ${escapeHtml(m)}
              </span>
            `;
          }).join("")}
        </div>
      </div>
    </div>

    <div class="filter-drawer-footer">
      <button class="btn-secondary" id="btnDrawerReset">
        Reset All
      </button>
      <button class="btn-primary" id="btnDrawerApply" style="flex: 1;">
        Apply Filters
      </button>
    </div>
  `;

  filterBackdrop.classList.add("visible");
  document.body.style.overflow = "hidden";

  attachFilterDrawerEvents(drawer);
}

export function closeFilterDrawer() {
  if (!filterBackdrop) return;
  filterBackdrop.classList.remove("visible");
  document.body.style.overflow = "";
}

function attachFilterDrawerEvents(drawer) {
  const btnClose = drawer.querySelector("#btnFilterClose");
  if (btnClose) btnClose.addEventListener("click", closeFilterDrawer);

  // Toggles
  const toggleRow = (id, key) => {
    const el = drawer.querySelector(id);
    if (el) {
      el.addEventListener("click", () => {
        FilterState[key] = !FilterState[key];
        el.classList.toggle("active", FilterState[key]);
        const box = el.querySelector(".custom-checkbox");
        if (box) box.innerHTML = FilterState[key] ? Icons.check : "";
      });
    }
  };

  toggleRow("#toggleDrawerFavs", "favoritesOnly");
  toggleRow("#toggleDrawerCatalogs", "hasCatalogsOnly");
  toggleRow("#toggleDrawerCommissions", "commissionsOnly");
  toggleRow("#toggleDrawerVerified", "verifiedOnly");
  toggleRow("#toggleDrawerNew", "newOnly");

  // Series selection
  drawer.querySelectorAll("[data-drawer-series]").forEach(chip => {
    chip.addEventListener("click", () => {
      const s = chip.dataset.drawerSeries;
      if (FilterState.selectedSeries.has(s)) {
        FilterState.selectedSeries.delete(s);
        chip.classList.remove("active");
      } else {
        FilterState.selectedSeries.add(s);
        chip.classList.add("active");
      }
    });
  });

  // Series search
  const seriesSearch = drawer.querySelector("#drawerSeriesSearch");
  if (seriesSearch) {
    seriesSearch.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      drawer.querySelectorAll("[data-drawer-series]").forEach(chip => {
        const matches = chip.dataset.drawerSeries.toLowerCase().includes(q);
        chip.style.display = matches ? "inline-flex" : "none";
      });
    });
  }

  // Merch selection
  drawer.querySelectorAll("[data-drawer-merch]").forEach(chip => {
    chip.addEventListener("click", () => {
      const m = chip.dataset.drawerMerch;
      if (FilterState.selectedMerch.has(m)) {
        FilterState.selectedMerch.delete(m);
        chip.classList.remove("active");
      } else {
        FilterState.selectedMerch.add(m);
        chip.classList.add("active");
      }
    });
  });

  // Merch search
  const merchSearch = drawer.querySelector("#drawerMerchSearch");
  if (merchSearch) {
    merchSearch.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      drawer.querySelectorAll("[data-drawer-merch]").forEach(chip => {
        const matches = chip.dataset.drawerMerch.toLowerCase().includes(q);
        chip.style.display = matches ? "inline-flex" : "none";
      });
    });
  }

  // Reset
  const btnReset = drawer.querySelector("#btnDrawerReset");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      FilterState.reset();
      closeFilterDrawer();
      const container = document.getElementById("artistsView");
      if (container) renderArtistsView(container);
      updateFilterBadge();
      showToast("Filters reset");
    });
  }

  // Apply
  const btnApply = drawer.querySelector("#btnDrawerApply");
  if (btnApply) {
    btnApply.addEventListener("click", () => {
      closeFilterDrawer();
      const container = document.getElementById("artistsView");
      if (container) renderArtistsView(container);
      updateFilterBadge();
    });
  }
}

// ==========================================================================
// Lightbox (Single & Multi-Image Gallery with Safe Preloading)
// ==========================================================================

export function openGalleryLightbox(images, startIndex = 0, artistName = "") {
  if (!lightboxBackdrop) return;

  currentGallery = Array.isArray(images) && images.length > 0 ? images : [];
  if (currentGallery.length === 0) return;

  currentGalleryIndex = Math.max(0, Math.min(startIndex, currentGallery.length - 1));
  currentGalleryArtistName = artistName || "";

  lightboxBackdrop.classList.add("visible");
  document.body.style.overflow = "hidden";

  showGallerySlide(currentGalleryIndex);
}

// Backwards-compatible single-image caller
export function openLightbox(url, caption = "") {
  if (!url) return;
  openGalleryLightbox([{ url, caption }], 0, caption);
}

export function showGallerySlide(index) {
  if (!lightboxBackdrop || currentGallery.length === 0) return;

  if (index < 0) index = currentGallery.length - 1;
  if (index >= currentGallery.length) index = 0;
  currentGalleryIndex = index;

  const currentItem = currentGallery[currentGalleryIndex];
  if (!currentItem) return;

  const captionEl = lightboxBackdrop.querySelector("#lightboxCaption");
  const counterEl = lightboxBackdrop.querySelector("#lightboxCounter");
  const imgEl = lightboxBackdrop.querySelector("#lightboxImg");
  const spinnerEl = lightboxBackdrop.querySelector("#lightboxSpinner");
  const errorEl = lightboxBackdrop.querySelector("#lightboxError");
  const btnPrev = lightboxBackdrop.querySelector("#btnLightboxPrev");
  const btnNext = lightboxBackdrop.querySelector("#btnLightboxNext");

  // Update text & counter
  const title = currentItem.caption || currentGalleryArtistName || "Catalog Preview";
  if (captionEl) captionEl.textContent = title;
  if (counterEl) {
    if (currentGallery.length > 1) {
      counterEl.textContent = `${currentGalleryIndex + 1} / ${currentGallery.length}`;
      counterEl.style.display = "inline-block";
    } else {
      counterEl.style.display = "none";
    }
  }

  // Toggle prev/next buttons
  const showNav = currentGallery.length > 1;
  if (btnPrev) btnPrev.style.display = showNav ? "flex" : "none";
  if (btnNext) btnNext.style.display = showNav ? "flex" : "none";

  // Hide error, show spinner, and hide current image while new one loads
  if (errorEl) errorEl.style.display = "none";
  if (spinnerEl) spinnerEl.style.display = "block";
  if (imgEl) {
    imgEl.style.opacity = "0";
  }

  // Track request ID to ignore stale responses from earlier slides
  const requestId = ++activeImageRequestId;
  const targetUrl = currentItem.url;

  // Safe preloading: do not assign to imgEl.src until bytes are ready
  const preloader = new Image();
  preloader.onload = () => {
    if (requestId !== activeImageRequestId) return;
    if (imgEl) {
      imgEl.src = targetUrl;
      imgEl.alt = title;
      imgEl.style.opacity = "1";
    }
    if (spinnerEl) spinnerEl.style.display = "none";
    if (errorEl) errorEl.style.display = "none";
  };

  preloader.onerror = () => {
    if (requestId !== activeImageRequestId) return;
    if (imgEl) {
      imgEl.src = "";
      imgEl.style.opacity = "0";
    }
    if (spinnerEl) spinnerEl.style.display = "none";
    if (errorEl) {
      errorEl.textContent = "Could not load image preview.";
      errorEl.style.display = "block";
    }
  };

  preloader.src = targetUrl;
}

export function nextGallerySlide() {
  if (currentGallery.length <= 1) return;
  showGallerySlide(currentGalleryIndex + 1);
}

export function prevGallerySlide() {
  if (currentGallery.length <= 1) return;
  showGallerySlide(currentGalleryIndex - 1);
}

export function closeLightbox() {
  if (!lightboxBackdrop) return;
  lightboxBackdrop.classList.remove("visible");

  // Invalidate any in-flight image loads
  activeImageRequestId++;

  const imgEl = lightboxBackdrop.querySelector("#lightboxImg");
  const spinnerEl = lightboxBackdrop.querySelector("#lightboxSpinner");
  const errorEl = lightboxBackdrop.querySelector("#lightboxError");

  // Blank out src completely so previous image NEVER lingers
  if (imgEl) {
    imgEl.src = "";
    imgEl.style.opacity = "0";
  }
  if (spinnerEl) spinnerEl.style.display = "none";
  if (errorEl) errorEl.style.display = "none";

  currentGallery = [];
  currentGalleryIndex = 0;
  currentGalleryArtistName = "";

  // Preserve body scroll lock if underlying artist modal is still visible
  if (modalBackdrop && modalBackdrop.classList.contains("visible")) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
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
