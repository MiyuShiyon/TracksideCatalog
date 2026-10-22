// Data Store & Indexer
export const Store = {
  conventions: [],
  currentConventionId: "",
  artists: [],
  rallies: [],
  merchCategories: [],

  // Indexes
  artistsById: new Map(),
  artistsByBooth: new Map(),
  seriesSet: new Set(),
  merchSet: new Set(),
  seriesCounts: new Map(),
  merchCounts: new Map(),

  async loadAll() {
    try {
      const [consRes, artsRes, ralRes, merchRes] = await Promise.all([
        fetch("./data/conventions.json"),
        fetch("./data/artists.json"),
        fetch("./data/rallies.json"),
        fetch("./data/merch_categories.json")
      ]);

      this.conventions = await consRes.json();
      this.artists = await artsRes.json();
      this.rallies = await ralRes.json();
      this.merchCategories = await merchRes.json();

      // Determine default convention
      const defaultCon = this.conventions.find(c => c.isDefault) || this.conventions[0];
      this.currentConventionId = defaultCon ? defaultCon.id : "";

      this.rebuildIndexes();
      return true;
    } catch (err) {
      console.error("Failed to load catalog data:", err);
      return false;
    }
  },

  getCurrentConvention() {
    return this.conventions.find(c => c.id === this.currentConventionId) || this.conventions[0];
  },

  setConvention(conId) {
    if (this.currentConventionId === conId) return;
    this.currentConventionId = conId;
    this.rebuildIndexes();
    window.dispatchEvent(new CustomEvent("convention-changed", { detail: { conId } }));
  },

  getArtistsForCurrentCon() {
    return this.artists.filter(a => a.conventionId === this.currentConventionId);
  },

  getRalliesForCurrentCon() {
    return this.rallies.filter(r => r.conventionId === this.currentConventionId);
  },

  rebuildIndexes() {
    this.artistsById.clear();
    this.artistsByBooth.clear();
    this.seriesSet.clear();
    this.merchSet.clear();
    this.seriesCounts.clear();
    this.merchCounts.clear();

    const conArtists = this.getArtistsForCurrentCon();

    for (const a of conArtists) {
      if (a.id) this.artistsById.set(a.id, a);

      if (a.booth) {
        const raw = a.booth.trim().toUpperCase();
        this.artistsByBooth.set(raw, a);
        // Also index normalized variants like "5" or "TABLE5"
        const numOnly = raw.replace(/[^0-9]/g, "");
        if (numOnly) {
          this.artistsByBooth.set(numOnly, a);
          this.artistsByBooth.set(`TABLE${numOnly}`, a);
          this.artistsByBooth.set(`TABLE ${numOnly}`, a);
          this.artistsByBooth.set(`TABLE #${numOnly}`, a);
          this.artistsByBooth.set(`T${numOnly.padStart(2, "0")}`, a);
        }
      }

      // Aggregate series
      if (Array.isArray(a.series)) {
        for (const s of a.series) {
          const trimmed = s.trim();
          if (!trimmed) continue;
          this.seriesSet.add(trimmed);
          this.seriesCounts.set(trimmed, (this.seriesCounts.get(trimmed) || 0) + 1);
        }
      }

      // Aggregate merch
      if (Array.isArray(a.merch)) {
        for (const m of a.merch) {
          const trimmed = m.trim();
          if (!trimmed) continue;
          this.merchSet.add(trimmed);
          this.merchCounts.set(trimmed, (this.merchCounts.get(trimmed) || 0) + 1);
        }
      }
    }
  },

  getArtistById(id) {
    return this.artistsById.get(id) || null;
  },

  getArtistByBooth(booth) {
    if (!booth) return null;
    const clean = booth.trim().toUpperCase();
    return this.artistsByBooth.get(clean) || null;
  }
};
