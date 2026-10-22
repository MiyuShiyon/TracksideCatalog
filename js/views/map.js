// View: Interactive Floor Map & Booth Locator
import { Store } from "../data.js";
import { FilterState, filterAndSortArtists } from "../search.js";
import { Favorites } from "../utils.js";
import { Icons } from "../components/icons.js";
import { openArtistModal } from "./modal.js";

let zoomLevel = 1.0;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX = 0;
let startY = 0;
let selectedBooth = null;

export function renderMapView(container, options = {}) {
  const con = Store.getCurrentConvention();
  const mapConfig = con.map || { type: "numbered", totalTables: 50, tablesPerRow: 5, sections: [] };

  const allArtists = Store.getArtistsForCurrentCon();
  const filteredArtists = FilterState.isFiltered() ? filterAndSortArtists(allArtists) : allArtists;
  const filteredBooths = new Set();
  filteredArtists.forEach(a => {
    if (a.booth) {
      filteredBooths.add(a.booth.toUpperCase());
      const num = a.booth.replace(/[^0-9]/g, "");
      if (num) {
        filteredBooths.add(num);
        filteredBooths.add(`TABLE ${num}`);
        filteredBooths.add(`TABLE${num}`);
      }
    }
  });

  const isFiltered = FilterState.isFiltered() || options.highlightFavorites;

  if (options.targetBooth) {
    selectedBooth = options.targetBooth.toUpperCase();
  }

  container.innerHTML = `
    <div class="map-view-wrapper">
      <!-- Floating Map Toolbar -->
      <div class="map-toolbar">
        <div class="map-legend">
          <div class="legend-item">
            <span class="legend-swatch" style="background-color: var(--primary);"></span>
            <span>Matched Table</span>
          </div>
          <div class="legend-item">
            <span class="legend-swatch" style="background-color: #ff544a;"></span>
            <span>♥ Favorited</span>
          </div>
          ${(mapConfig.sections || []).map(sec => `
            <div class="legend-item">
              <span class="legend-swatch" style="background-color: ${sec.borderColor || sec.color};"></span>
              <span>${escapeHtml(sec.name)}</span>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Floating Zoom Controls -->
      <div class="map-controls-floating">
        <button class="map-ctrl-btn" id="btnZoomIn" title="Zoom In">${Icons.plus}</button>
        <button class="map-ctrl-btn" id="btnZoomOut" title="Zoom Out">${Icons.minus}</button>
        <button class="map-ctrl-btn" id="btnZoomReset" title="Reset Map View">${Icons.rotateCcw}</button>
      </div>

      <!-- Pan & Zoom Viewport -->
      <div class="map-viewport" id="mapViewport">
        <div class="map-canvas" id="mapCanvas" style="transform: translate(${panX}px, ${panY}px) scale(${zoomLevel});">
          ${mapConfig.type === "numbered" 
            ? renderNumberedTables(mapConfig, filteredBooths, isFiltered)
            : renderAisles(mapConfig, filteredBooths, isFiltered)}
        </div>
      </div>

      <!-- Floating Table Popover -->
      <div class="map-booth-popover" id="mapBoothPopover"></div>
    </div>
  `;

  attachMapEvents(container);

  if (selectedBooth) {
    highlightBooth(selectedBooth, container);
  }
}

function renderNumberedTables(mapConfig, filteredBooths, isFiltered) {
  const total = mapConfig.totalTables || 40;
  const perRow = mapConfig.tablesPerRow || 5;
  const sections = mapConfig.sections || [];

  const rows = [];
  for (let i = 1; i <= total; i += perRow) {
    const rowTables = [];
    for (let j = i; j < i + perRow && j <= total; j++) {
      const boothCode = `Table ${j}`;
      const boothCodeSimple = `${j}`;
      const artist = Store.getArtistByBooth(boothCode) || Store.getArtistByBooth(boothCodeSimple);
      const hasArtist = Boolean(artist);
      const isFav = artist && Favorites.has(artist.id);

      let sectionStyle = "";
      const sec = sections.find(s => j >= s.range[0] && j <= s.range[1]);
      if (sec) {
        sectionStyle = `border-top: 3px solid ${sec.borderColor || sec.color};`;
      }

      let classNames = ["booth-cell"];
      if (!hasArtist) classNames.push("empty");
      if (isFav) classNames.push("favorite");

      if (isFiltered) {
        if (filteredBooths.has(boothCode.toUpperCase()) || filteredBooths.has(boothCodeSimple)) {
          classNames.push("highlighted");
        } else if (hasArtist) {
          classNames.push("dimmed");
        }
      }

      rowTables.push(`
        <div class="${classNames.join(" ")}" 
             style="${sectionStyle}" 
             data-booth="${boothCode}" 
             data-has-artist="${hasArtist}">
          <div class="booth-cell-top">
            <span class="booth-cell-number">${boothCode}</span>
            ${isFav ? `<span style="font-size: 11px; color: #ff544a;">♥</span>` : ""}
          </div>
          <div class="booth-cell-name">
            ${hasArtist ? escapeHtml(artist.name) : ""}
          </div>
        </div>
      `);
    }

    rows.push(`
      <div style="display: flex; gap: 14px; justify-content: flex-start; align-items: center;">
        <span class="booth-badge" style="width: 60px; text-align: center; font-size: 11px;">Row ${Math.floor((i-1)/perRow) + 1}</span>
        ${rowTables.join("")}
      </div>
    `);
  }

  return `
    <div class="map-section">
      <div class="map-section-header">
        ${Store.getCurrentConvention().name} — Artist Alley Layout
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
        ${rows.join("")}
      </div>
    </div>
  `;
}

function renderAisles(mapConfig, filteredBooths, isFiltered) {
  const aisles = mapConfig.aisles || ["A", "B", "C", "D"];
  const tablesPerAisle = mapConfig.tablesPerAisle || 30;
  const sections = mapConfig.sections || [];

  return `
    <div class="map-section">
      <div class="map-section-header">
        ${Store.getCurrentConvention().name} — Artist Alley Layout
      </div>

      <div class="map-aisles-row">
        ${aisles.map(aisleLetter => {
          return `
            <div class="map-aisle-column">
              <div class="aisle-label">${aisleLetter}</div>
              ${renderAisleTables(aisleLetter, tablesPerAisle, filteredBooths, isFiltered, sections)}
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderAisleTables(aisleLetter, count, filteredBooths, isFiltered, sections) {
  const cells = [];

  for (let i = 1; i <= count; i++) {
    const numStr = String(i).padStart(2, "0");
    const boothCode = `${aisleLetter}${numStr}`;
    const artist = Store.getArtistByBooth(boothCode);
    const hasArtist = Boolean(artist);
    const isFav = artist && Favorites.has(artist.id);

    let sectionStyle = "";
    const sec = sections.find(s => i >= s.range[0] && i <= s.range[1]);
    if (sec) {
      sectionStyle = `border-left: 3px solid ${sec.borderColor || sec.color};`;
    }

    let classNames = ["booth-cell"];
    if (!hasArtist) classNames.push("empty");
    if (isFav) classNames.push("favorite");

    if (isFiltered) {
      if (filteredBooths.has(boothCode)) {
        classNames.push("highlighted");
      } else if (hasArtist) {
        classNames.push("dimmed");
      }
    }

    cells.push(`
      <div class="${classNames.join(" ")}" 
           style="${sectionStyle}" 
           data-booth="${boothCode}" 
           data-has-artist="${hasArtist}">
        <div class="booth-cell-top">
          <span class="booth-cell-number">${boothCode}</span>
          ${isFav ? `<span style="font-size: 11px; color: #ff544a;">♥</span>` : ""}
        </div>
        <div class="booth-cell-name">
          ${hasArtist ? escapeHtml(artist.name) : ""}
        </div>
      </div>
    `);
  }

  return cells.join("");
}

function attachMapEvents(container) {
  const viewport = container.querySelector("#mapViewport");
  const canvas = container.querySelector("#mapCanvas");
  const popover = container.querySelector("#mapBoothPopover");

  // Pan interaction
  viewport.addEventListener("mousedown", e => {
    if (e.target.closest(".booth-cell") && e.target.closest(".booth-cell").dataset.hasArtist === "true") {
      return;
    }
    isPanning = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    viewport.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", e => {
    if (!isPanning) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
  });

  window.addEventListener("mouseup", () => {
    if (isPanning) {
      isPanning = false;
      viewport.style.cursor = "grab";
    }
  });

  // Touch pan
  viewport.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      startX = touch.clientX - panX;
      startY = touch.clientY - panY;
      isPanning = true;
    }
  }, { passive: true });

  viewport.addEventListener("touchmove", e => {
    if (!isPanning || e.touches.length !== 1) return;
    const touch = e.touches[0];
    panX = touch.clientX - startX;
    panY = touch.clientY - startY;
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
  }, { passive: true });

  viewport.addEventListener("touchend", () => {
    isPanning = false;
  });

  // Zoom buttons
  const btnZoomIn = container.querySelector("#btnZoomIn");
  const btnZoomOut = container.querySelector("#btnZoomOut");
  const btnZoomReset = container.querySelector("#btnZoomReset");

  if (btnZoomIn) {
    btnZoomIn.addEventListener("click", () => {
      zoomLevel = Math.min(2.0, zoomLevel + 0.2);
      canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener("click", () => {
      zoomLevel = Math.max(0.4, zoomLevel - 0.2);
      canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    });
  }

  if (btnZoomReset) {
    btnZoomReset.addEventListener("click", () => {
      zoomLevel = 1.0;
      panX = 0;
      panY = 0;
      canvas.style.transform = `translate(0px, 0px) scale(1.0)`;
      if (popover) popover.classList.remove("visible");
    });
  }

  // Wheel zoom
  viewport.addEventListener("wheel", e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoomLevel = Math.min(2.0, Math.max(0.4, zoomLevel + delta));
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
  }, { passive: false });

  // Booth cell click
  container.querySelectorAll(".booth-cell").forEach(cell => {
    cell.addEventListener("click", e => {
      e.stopPropagation();
      const booth = cell.dataset.booth;
      const artist = Store.getArtistByBooth(booth);

      if (!artist) {
        if (popover) popover.classList.remove("visible");
        return;
      }

      showBoothPopover(artist, popover);
    });
  });
}

function showBoothPopover(artist, popover) {
  if (!popover) return;

  popover.innerHTML = `
    <img class="popover-avatar" src="${escapeHtml(artist.profileImage || './assets/icons/favicon.svg')}" alt="${escapeHtml(artist.name)}" onerror="this.src='./assets/icons/favicon.svg'"/>
    
    <div class="popover-details">
      <div class="popover-booth-row">
        <span class="booth-badge">${escapeHtml(artist.booth)}</span>
        ${artist.verified ? `<span class="badge-tag badge-verified">Verified</span>` : ""}
      </div>
      <div class="popover-name">${escapeHtml(artist.name)}</div>
      <div class="popover-summary">${escapeHtml(artist.summary || "No bio provided.")}</div>
    </div>

    <div class="popover-actions">
      <button class="btn-primary" id="btnPopoverViewDetails" style="padding: 6px 14px; font-size: 13px;">
        Details
      </button>
      <button class="popover-close-btn" id="btnPopoverClose">
        ${Icons.close}
      </button>
    </div>
  `;

  popover.classList.add("visible");

  const btnDetails = popover.querySelector("#btnPopoverViewDetails");
  if (btnDetails) {
    btnDetails.addEventListener("click", () => {
      openArtistModal(artist.id);
    });
  }

  const btnClose = popover.querySelector("#btnPopoverClose");
  if (btnClose) {
    btnClose.addEventListener("click", () => {
      popover.classList.remove("visible");
    });
  }
}

function highlightBooth(boothCode, container) {
  const norm = boothCode.replace(/[^0-9]/g, "");
  const cell = container.querySelector(`[data-booth="${boothCode}"]`) || 
               container.querySelector(`[data-booth="Table ${norm}"]`) ||
               container.querySelector(`[data-booth="${norm}"]`);
  if (!cell) return;

  cell.classList.add("highlighted");
  cell.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

  const artist = Store.getArtistByBooth(boothCode);
  if (artist) {
    const popover = container.querySelector("#mapBoothPopover");
    showBoothPopover(artist, popover);
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
