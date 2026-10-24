// View: Convention Stamp Rallies
import { Store } from "../data.js";
import { Icons } from "../components/icons.js";
import { openArtistModal, openLightbox } from "./modal.js";

export function renderRalliesView(container) {
  const rallies = Store.getRalliesForCurrentCon();

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2 class="view-title">Stamp Rallies</h2>
        <span class="view-count">${rallies.length} active stamp rallies</span>
      </div>
    </div>

    <div class="artists-grid" style="grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));">
      ${rallies.length > 0 ? rallies.map(rally => renderRallyCard(rally)).join("") : renderEmptyRalliesState()}
    </div>
  `;

  attachRalliesEvents(container);
}

function renderRallyCard(rally) {
  const images = rally.images || [];

  return `
    <article class="artist-card" style="cursor: default;" data-rally-id="${rally.id}">
      <div class="artist-card-header">
        <div class="artist-header-info">
          <div class="artist-booth-row">
            <span class="booth-badge" style="background-color: rgba(var(--primary-rgb), 0.15); color: var(--primary);">
              Host: ${escapeHtml(rally.hostBooth)}
            </span>
            <span class="badge-tag badge-verified">${escapeHtml(rally.fandom)}</span>
          </div>
          <h3 class="artist-name" style="font-size: 17px;">${escapeHtml(rally.title)}</h3>
        </div>
      </div>

      <div class="artist-card-body">
        <!-- Participating Tables -->
        <div style="margin-bottom: 12px;">
          <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px;">
            Participating Tables (${rally.minTables ? `Visit ${rally.minTables} tables min` : "All tables"})
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${(rally.booths || []).map(b => {
              const artist = Store.getArtistByBooth(b);
              let label = b;
              if (artist) {
                const handle = b.replace(/^@/, "");
                const cleanName = artist.name.replace(new RegExp(`\\s*\\(?@?${handle}\\)?`, "i"), "").trim();
                label = `${b} · ${cleanName || artist.name}`;
              }
              return `
                <button class="tag-pill" data-booth-jump="${escapeHtml(b)}" title="${artist ? escapeHtml(artist.name) : b}" style="cursor: pointer; font-weight: 600;">
                  ${escapeHtml(label)}
                </button>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Prize Info -->
        <div style="margin-bottom: 12px; background-color: var(--surface-container); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 12px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #ffca4a; margin-bottom: 2px;">
            ★ Prize
          </div>
          <div style="font-size: 13px; color: var(--text-heading); font-weight: 500;">
            ${escapeHtml(rally.prize || "Exclusive convention stamp rally prize")}
          </div>
        </div>

        ${rally.notes ? `
          <p class="artist-summary" style="-webkit-line-clamp: 3; margin-bottom: 12px;">
            ${escapeHtml(rally.notes)}
          </p>
        ` : ""}

        <!-- Previews -->
        ${images.length > 0 ? `
          <div class="artist-card-images">
            ${images.map(img => `
              <img class="card-img-thumb" src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption || rally.title)}" loading="lazy" style="width: 110px; height: 80px; cursor: pointer;" data-lightbox-src="${escapeHtml(img.url)}" data-caption="${escapeHtml(img.caption || rally.title)}"/>
            `).join("")}
          </div>
        ` : ""}

        <!-- Links -->
        ${(rally.links || []).length > 0 ? `
          <div style="margin-top: 10px; display: flex; gap: 8px;">
            ${rally.links.map(link => `
              <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="social-link-btn" style="padding: 5px 10px; font-size: 12px;">
                ${Icons.twitter} Announcement ${Icons.externalLink}
              </a>
            `).join("")}
          </div>
        ` : ""}
      </div>
    </article>
  `;
}

function renderEmptyRalliesState() {
  return `
    <div class="empty-state">
      <div class="empty-icon">${Icons.stamp}</div>
      <h3 class="empty-title">No stamp rallies listed</h3>
      <p class="empty-desc">There are currently no registered stamp rallies for this convention event.</p>
    </div>
  `;
}

function attachRalliesEvents(container) {
  // Click on a booth chip jumps to that artist's details
  container.querySelectorAll("[data-booth-jump]").forEach(btn => {
    btn.addEventListener("click", () => {
      const booth = btn.dataset.boothJump;
      const artist = Store.getArtistByBooth(booth);
      if (artist) {
        openArtistModal(artist.id);
      }
    });
  });

  // Lightbox click on preview image
  container.querySelectorAll("[data-lightbox-src]").forEach(img => {
    img.addEventListener("click", () => {
      openLightbox(img.dataset.lightboxSrc, img.dataset.caption);
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
