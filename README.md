# Trackside Catalog

An ultra-fast, mobile-friendly **Artist Alley Directory & Interactive Catalog** built in the format, aesthetic, and performance of [artistalley.directory](https://artistalley.directory/).

Designed to be hosted directly on **GitHub Pages** with zero build steps, instant load times, offline PWA support, and an automated data pipeline.

---

## 🌟 Key Features

* **🎨 Artists Directory**:
  * Real-time search across artist names, booth numbers, fandoms, and merchandise categories.
  * Booth badges (`A01`, `B12`), verified artist checkmarks, new artist tags, and commission status badges.
  * Preview thumbnails with full-screen zoomable lightbox for catalogs and prints.
  * Social media links with authentic brand icons (Twitter/X, Instagram, Carrd, Portfolio, Etsy, Big Cartel).
  * Toggle between **Rich Visual Grid** and **Compact List** layouts.

* **🗺️ Interactive Floor Map**:
  * Pan-and-zoom 2D floor grid of convention aisles and tables with section highlights.
  * Highlights matching booths when searching or filtering; dims non-matching tables.
  * Glowing marker for all favorited artists.
  * Click any table to open the popover card and jump directly to the artist's full details.

* **📚 Browse by Fandom & Merchandise**:
  * Complete alphabetical and popularity-sorted index of all featured anime, gaming, and pop-culture series.
  * Categorized merchandise index (Prints, Charms, Standees, Enamel Pins, Plushies, Apparel, etc.).
  * Tap any series or merch chip to immediately filter the catalog.

* **♥ Favorites & Planner**:
  * Bookmark artists with persistent local storage.
  * **Export Favorites** to JSON or **Import Favorites** from a previous session or friend.
  * **View Favorites on Map** to plan your convention walk route.

* **🏷️ Stamp Rallies**:
  * Track convention stamp rallies, host tables, participating booths, minimum table requirements, and exclusive prize descriptions.

* **⚡ Performance & PWA**:
  * Zero compile dependencies: pure standards-compliant modern JavaScript (ES6 modules) and CSS3.
  * Offline-capable PWA with Service Worker caching (`sw.js`).
  * Dark Mode by default (`#070707` & `#EE3C35` accents) with optional Light Mode toggle.

---

## 🚀 Hosting on GitHub Pages

This repository is built to work immediately on GitHub Pages without needing Node.js or build runners:

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Initialize Trackside Catalog directory"
   git push origin master
   ```
2. On GitHub, navigate to **Settings** > **Pages** (under "Code and automation").
3. Under **Build and deployment**:
   * **Source**: `Deploy from a branch`
   * **Branch**: `master` (or `main`)
   * **Folder**: `/ (root)`
4. Click **Save**. Your site will be live at:
   ```
   https://<your-username>.github.io/TracksideCatalog/
   ```

---

## 📝 How to Add Data

You can simply provide **Twitter links**, **catalog posts**, or **documents/spreadsheets**, and I will parse and add them for you!

### 1. By Providing Twitter / X Links or Info in Chat
Whenever you have artist info, send a prompt like:
> *"Add this artist: https://x.com/artistname/status/123456789 - Booth B14, sells prints and charms for Honkai Star Rail and Frieren"*

I will extract the details, booth, series, merchandise, and preview image, and update the catalog database.

---

### 2. Automated Social Media Scraping & Ingestion

#### A. Scrape & Add a Single Vendor from Twitter/X or Instagram
```bash
python scripts/scrape_vendor.py https://x.com/artist/status/123456789
python scripts/scrape_vendor.py https://www.instagram.com/p/DFxyz123/ --booth "Table 15"
```
Automatically extracts artist name, handle, booth/table number, bio, preview images (downloaded directly to `assets/catalogs/<artist_id>/`), avatar, series tags, and merch tags, and updates `data/artists.json`.

#### B. Batch Ingest from `data/pending/`
Simply paste a list of Twitter or Instagram URLs into a text file in `data/pending/` (e.g., `data/pending/vendors.txt`):
```text
https://x.com/forks/status/2113061418358706442
https://x.com/mikou_art/status/2026850409953493213
https://www.instagram.com/p/DVx8T_6EnFm/
```
Then run:
```bash
python scripts/ingest_pending.py
```
This batch processes all URLs, downloads all images locally, updates `data/artists.json`, cleans up the pending file, and automatically runs data validation.

#### C. Manual Add / Update via CLI
```bash
python scripts/add_artist.py \
  --name "Aki Studio" \
  --booth "Table 14" \
  --con "trackside-2026" \
  --twitter "https://x.com/akistudio/status/1888999999" \
  --series "Sousou no Frieren, Genshin Impact, Dungeon Meshi" \
  --merch "Prints, Charms, Standees" \
  --summary "Soft anime art prints and holographic acrylic standees." \
  --verified
```

#### D. Validate Data Integrity
```bash
python scripts/validate_data.py
```

---

## 📂 Project Structure

```
TracksideCatalog/
├── index.html                  # Main SPA entry point
├── manifest.webmanifest        # PWA configuration
├── sw.js                       # Service worker for offline caching
├── css/
│   ├── style.css               # Main theme, cards, headers, layouts
│   ├── map.css                 # Interactive floor map & pan/zoom grid
│   └── modal.css               # Detail modal, filter drawer, lightbox
├── js/
│   ├── app.js                  # App bootstrap, tab router & event setup
│   ├── data.js                 # Data loader, normalizer, and indexes
│   ├── search.js               # Fuzzy search and multi-facet filtering engine
│   ├── utils.js                # Favorites storage, natural sorting, themes
│   ├── components/
│   │   ├── icons.js            # SVG icons dictionary (socials, badges, UI)
│   │   └── toast.js            # Floating notification toasts
│   └── views/
│       ├── artists.js          # Artists grid & compact view
│       ├── browse.js           # Series & Merch index
│       ├── favorites.js        # Favorites manager (export/import)
│       ├── map.js              # Interactive floor map with booth popover
│       ├── rallies.js          # Stamp rallies directory
│       └── modal.js            # Artist details modal, filter drawer, lightbox
├── data/
│   ├── conventions.json        # Convention metadata & floor map configurations
│   ├── artists.json            # Main database of artists
│   ├── rallies.json            # Stamp rallies database
│   ├── merch_categories.json   # Standard merchandise categories
│   └── pending/                # Drop lists of vendor links here for ingestion
├── assets/
│   ├── icons/favicon.svg       # Brand vector icon
│   ├── avatars/                # Local artist avatars
│   └── catalogs/               # Local catalog images by artist
└── scripts/
    ├── scraper.py              # Social media extraction engine (Twitter/X, Instagram)
    ├── scrape_vendor.py        # CLI single vendor scraper
    ├── ingest_pending.py       # Batch pending file ingester
    ├── add_artist.py           # CLI tool to manually add/update an artist
    ├── import_doc.py           # Document/text parser for batch submissions
    └── validate_data.py        # Schema and validation checker
```

---

## 💻 Local Preview

Run any static server from the project directory:
```bash
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your web browser.
