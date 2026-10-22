#!/usr/bin/env python3
"""
scripts/scrape_vendor.py
Scrapes a single vendor post from Twitter/X or Instagram,
downloads catalog assets and avatar, and adds/updates data/artists.json.

Usage:
  python scripts/scrape_vendor.py https://x.com/artist/status/123456789
  python scripts/scrape_vendor.py https://x.com/artist/status/123456789 --booth "Table 15"
"""

import argparse
import json
import sys
from pathlib import Path
from scraper import scrape_url

ROOT = Path(__file__).resolve().parent.parent
ARTISTS_FILE = ROOT / "data" / "artists.json"

def main():
    parser = argparse.ArgumentParser(description="Scrape and add a vendor from Twitter/X or Instagram.")
    parser.add_argument("url", help="Post URL from Twitter/X or Instagram")
    parser.add_argument("--booth", help="Override booth / table number")
    parser.add_argument("--name", help="Override artist name")
    parser.add_argument("--series", help="Comma-separated series list")
    parser.add_argument("--merch", help="Comma-separated merch list")
    parser.add_argument("--notes", help="Table or convention notes")

    args = parser.parse_args()

    print(f"Scraping {args.url}...")
    try:
        entry = scrape_url(args.url)
    except Exception as e:
        print(f"Error scraping URL: {e}", file=sys.stderr)
        sys.exit(1)

    # Apply overrides
    if args.booth:
        entry["booth"] = args.booth.strip()
    if args.name:
        entry["name"] = args.name.strip()
    if args.series:
        entry["series"] = [s.strip() for s in args.series.split(",") if s.strip()]
        entry["seriesConfirmed"] = entry["series"]
    if args.merch:
        entry["merch"] = [m.strip() for m in args.merch.split(",") if m.strip()]
    if args.notes:
        entry["notes"] = args.notes.strip()

    print(f"✓ Scraped: {entry['name']} at {entry['booth']}")
    print(f"  Series: {', '.join(entry['series'])}")
    print(f"  Merch: {', '.join(entry['merch'])}")
    print(f"  Images saved: {len(entry['images'])}")

    # Load and update artists.json
    if ARTISTS_FILE.exists():
        with open(ARTISTS_FILE, "r", encoding="utf-8") as f:
            artists = json.load(f)
    else:
        artists = []

    # Check for existing
    updated = False
    for i, a in enumerate(artists):
        if a.get("id") == entry["id"] or (a.get("booth") == entry["booth"] and entry["booth"] != "Table TBA"):
            artists[i].update(entry)
            updated = True
            break

    if not updated:
        artists.append(entry)

    with open(ARTISTS_FILE, "w", encoding="utf-8") as f:
        json.dump(artists, f, indent=2, ensure_ascii=False)

    print(f"✓ Successfully {'updated' if updated else 'added'} {entry['name']} in {ARTISTS_FILE}!")

if __name__ == "__main__":
    main()
