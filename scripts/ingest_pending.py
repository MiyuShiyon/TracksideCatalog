#!/usr/bin/env python3
"""
scripts/ingest_pending.py
Batch processor that ingests vendor URLs from data/pending/ (or a specified file),
scrapes metadata, downloads assets, updates data/artists.json, and cleans up.

Usage:
  python scripts/ingest_pending.py
  python scripts/ingest_pending.py data/pending/vendors.txt
"""

import json
import sys
import time
from pathlib import Path
from scraper import scrape_url

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
PENDING_DIR = DATA_DIR / "pending"
ARTISTS_FILE = DATA_DIR / "artists.json"

def process_file(file_path: Path):
    print(f"\nProcessing {file_path}...")
    lines = file_path.read_text(encoding="utf-8").splitlines()
    urls = [l.strip() for l in lines if l.strip().startswith("http")]

    if not urls:
        print("  No URLs found in file.")
        return

    print(f"  Found {len(urls)} URLs to ingest.\n")

    # Load current artists
    if ARTISTS_FILE.exists():
        with open(ARTISTS_FILE, "r", encoding="utf-8") as f:
            artists = json.load(f)
    else:
        artists = []

    artists_map = {a.get("id"): a for a in artists if a.get("id")}

    success_count = 0
    fail_count = 0

    for idx, url in enumerate(urls, 1):
        print(f"[{idx}/{len(urls)}] Scraping {url}...")
        try:
            entry = scrape_url(url)
            aid = entry["id"]

            if aid in artists_map:
                print(f"  → Updating existing entry for {entry['name']} ({entry['booth']})")
                artists_map[aid].update(entry)
            else:
                print(f"  → Adding new entry for {entry['name']} ({entry['booth']})")
                artists_map[aid] = entry

            success_count += 1
        except Exception as e:
            print(f"  ✖ Failed to scrape {url}: {e}")
            fail_count += 1

        time.sleep(0.3)

    # Save artists
    updated_artists = list(artists_map.values())
    with open(ARTISTS_FILE, "w", encoding="utf-8") as f:
        json.dump(updated_artists, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Saved {len(updated_artists)} total artists to {ARTISTS_FILE}")
    print(f"  Successful: {success_count}, Failed: {fail_count}")

    # Remove the ingested file
    try:
        file_path.unlink()
        print(f"✓ Removed processed file: {file_path}")
    except Exception as e:
        print(f"  Warning: could not delete {file_path}: {e}")

def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    if len(sys.argv) > 1:
        target = Path(sys.argv[1])
        if not target.exists():
            print(f"Error: {target} does not exist.", file=sys.stderr)
            sys.exit(1)
        process_file(target)
    else:
        # Scan data/pending/
        if not PENDING_DIR.exists():
            print(f"No pending directory found at {PENDING_DIR}")
            return

        files = list(PENDING_DIR.glob("*.txt")) + list(PENDING_DIR.glob("*.json"))
        if not files:
            print(f"No pending files found in {PENDING_DIR}")
            return

        for f in files:
            process_file(f)

    # Run data validation
    print("\nRunning schema validation...")
    import validate_data
    validate_data.check()

if __name__ == "__main__":
    main()
