// Search & Filtering Engine
import { Favorites, compareBooths } from "./utils.js";

export const FilterState = {
  query: "",
  selectedSeries: new Set(),
  selectedMerch: new Set(),
  favoritesOnly: false,
  hasCatalogsOnly: false,
  commissionsOnly: false,
  verifiedOnly: false,
  newOnly: false,
  sortBy: "booth", // "booth" | "name" | "catalogs" | "popular"

  reset() {
    this.query = "";
    this.selectedSeries.clear();
    this.selectedMerch.clear();
    this.favoritesOnly = false;
    this.hasCatalogsOnly = false;
    this.commissionsOnly = false;
    this.verifiedOnly = false;
    this.newOnly = false;
    this.sortBy = "booth";
  },

  getActiveFilterCount() {
    let count = 0;
    if (this.selectedSeries.size > 0) count += this.selectedSeries.size;
    if (this.selectedMerch.size > 0) count += this.selectedMerch.size;
    if (this.favoritesOnly) count++;
    if (this.hasCatalogsOnly) count++;
    if (this.commissionsOnly) count++;
    if (this.verifiedOnly) count++;
    if (this.newOnly) count++;
    return count;
  },

  isFiltered() {
    return this.query.trim().length > 0 || this.getActiveFilterCount() > 0;
  }
};

export function filterAndSortArtists(artists) {
  const query = FilterState.query.trim().toLowerCase();
  const queryWords = query ? query.split(/\s+/).filter(Boolean) : [];

  let result = artists.filter(artist => {
    // 1. Text Query Filter
    if (queryWords.length > 0) {
      const boothStr = (artist.booth || "").toLowerCase();
      const nameStr = (artist.name || "").toLowerCase();
      const aliasesStr = (artist.aliases || []).join(" ").toLowerCase();
      const summaryStr = (artist.summary || "").toLowerCase();
      const seriesStr = (artist.series || []).join(" ").toLowerCase();
      const merchStr = (artist.merch || []).join(" ").toLowerCase();

      const combined = `${boothStr} ${nameStr} ${aliasesStr} ${summaryStr} ${seriesStr} ${merchStr}`;

      const matchesAllWords = queryWords.every(word => {
        // Fast check for booth match or word inclusion
        if (boothStr === word || boothStr.startsWith(word)) return true;
        return combined.includes(word);
      });

      if (!matchesAllWords) return false;
    }

    // 2. Favorites only
    if (FilterState.favoritesOnly && !Favorites.has(artist.id)) {
      return false;
    }

    // 3. Has Catalogs / Images
    if (FilterState.hasCatalogsOnly) {
      const hasImages = Array.isArray(artist.images) && artist.images.length > 0;
      const hasLinks = Array.isArray(artist.catalogLinks) && artist.catalogLinks.length > 0;
      if (!hasImages && !hasLinks) return false;
    }

    // 4. Commissions
    if (FilterState.commissionsOnly) {
      const comm = (artist.commissions || "").toLowerCase();
      if (!comm || comm.includes("closed") || comm.includes("not offering")) {
        return false;
      }
    }

    // 5. Verified
    if (FilterState.verifiedOnly && !artist.verified) {
      return false;
    }

    // 6. New Artist
    if (FilterState.newOnly && !artist.isNew) {
      return false;
    }

    // 7. Selected Series Filter
    if (FilterState.selectedSeries.size > 0) {
      const artistSeries = new Set((artist.series || []).map(s => s.toLowerCase()));
      let hasMatch = false;
      for (const sel of FilterState.selectedSeries) {
        if (artistSeries.has(sel.toLowerCase())) {
          hasMatch = true;
          break;
        }
      }
      if (!hasMatch) return false;
    }

    // 8. Selected Merch Filter
    if (FilterState.selectedMerch.size > 0) {
      const artistMerch = new Set((artist.merch || []).map(m => m.toLowerCase()));
      let hasMatch = false;
      for (const sel of FilterState.selectedMerch) {
        if (artistMerch.has(sel.toLowerCase())) {
          hasMatch = true;
          break;
        }
      }
      if (!hasMatch) return false;
    }

    return true;
  });

  // Sorting
  result.sort((a, b) => {
    switch (FilterState.sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "catalogs": {
        const aCount = (a.images ? a.images.length : 0) + (a.catalogLinks ? a.catalogLinks.length : 0);
        const bCount = (b.images ? b.images.length : 0) + (b.catalogLinks ? b.catalogLinks.length : 0);
        return bCount - aCount || compareBooths(a.booth, b.booth);
      }
      case "popular": {
        const aFav = Favorites.has(a.id) ? 1 : 0;
        const bFav = Favorites.has(b.id) ? 1 : 0;
        return bFav - aFav || compareBooths(a.booth, b.booth);
      }
      case "booth":
      default:
        return compareBooths(a.booth, b.booth);
    }
  });

  return result;
}
