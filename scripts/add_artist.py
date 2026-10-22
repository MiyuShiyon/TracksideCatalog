#!/usr/bin/env python3
"""
scripts/add_artist.py
Helper tool to quickly add or update artist entries in TracksideCatalog.
Can be invoked from CLI arguments or by passing a JSON payload.

Usage examples:
  python scripts/add_artist.py \
    --name "Aki Studio" \
    --booth "B14" \
    --con "trackside-2026" \
    --twitter "https://x.com/akistudio/status/1888999999" \
    --series "Frieren, Genshin Impact, Dungeon Meshi" \
    --merch "Prints, Charms, Standees" \
    --summary "Illustrator making soft anime art and charms." \
    --verified

Or via JSON input:
  python scripts/add_artist.py --json-input '{"name": "...", "booth": "B14", ...}'
"""

import json
import os
import re
import sys
import argparse
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "artists.json"

def clean_url(url: str) -> str:
    url = url.strip()
    if not url:
        return ""
    if not url.startswith("http://") and not url.startswith("https://"):
        if "x.com" in url or "twitter.com" in url or "instagram.com" in url:
            url = "https://" + url
        elif url.startswith("@"):
            url = f"https://x.com/{url.lstrip('@')}"
    return url

def slugify(text: str) -> str:
    s = re.sub(r'[^a-zA-Z0-9]+', '-', text.lower()).strip('-')
    return s or "artist"

def main():
    parser = argparse.ArgumentParser(description="Add or update an artist in TracksideCatalog")
    parser.add_argument("--name", help="Artist or Circle name")
    parser.add_argument("--booth", help="Booth code (e.g. A01, B12)")
    parser.add_argument("--con", default="trackside-2026", help="Convention ID (default: trackside-2026)")
    parser.add_argument("--twitter", help="Twitter / X link or catalog post")
    parser.add_argument("--instagram", help="Instagram link or handle")
    parser.add_argument("--carrd", help="Carrd / Portfolio link")
    parser.add_argument("--store", help="Online store link (Etsy, BigCartel, etc.)")
    parser.add_argument("--summary", default="", help="Artist bio or table summary")
    parser.add_argument("--commissions", default="", help="Commission status (e.g. 'Open at table', 'Closed')")
    parser.add_argument("--series", default="", help="Comma-separated series/fandom tags")
    parser.add_argument("--merch", default="", help="Comma-separated merch tags (Prints, Charms, etc.)")
    parser.add_argument("--image", action="append", default=[], help="Image URL for catalog preview")
    parser.add_argument("--profile-image", default="", help="Avatar/profile image URL")
    parser.add_argument("--notes", default="", help="Table notes, specials, payment info")
    parser.add_argument("--verified", action="store_true", help="Mark artist as verified")
    parser.add_argument("--new", action="store_true", help="Mark artist as new exhibitor")
    parser.add_argument("--json-input", help="Direct JSON object string for the artist")

    args = parser.parse_args()

    entry = {}
    if args.json_input:
        try:
            entry = json.loads(args.json_input)
        except Exception as e:
            print(f"Error parsing JSON input: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        if not args.name or not args.booth:
            parser.error("Both --name and --booth are required unless --json-input is provided.")
        
        social_links = []
        catalog_links = []
        if args.twitter:
            tw = clean_url(args.twitter)
            if "status/" in tw:
                catalog_links.append(tw)
                # Also add profile url
                handle_match = re.search(r'(?:twitter\.com|x\.com)/([a-zA-Z0-9_]+)', tw)
                if handle_match:
                    social_links.append(f"https://x.com/{handle_match.group(1)}")
            else:
                social_links.append(tw)

        if args.instagram:
            ig = clean_url(args.instagram)
            if not ig.startswith("http"):
                ig = f"https://instagram.com/{ig.lstrip('@')}"
            social_links.append(ig)

        if args.carrd:
            social_links.append(clean_url(args.carrd))

        store_links = [clean_url(args.store)] if args.store else []

        series_list = [s.strip() for s in args.series.split(",") if s.strip()]
        merch_list = [m.strip() for m in args.merch.split(",") if m.strip()]

        images_list = []
        for img in args.image:
            images_list.append({
                "url": img.strip(),
                "caption": f"{args.name} Catalog Preview",
                "width": 1200,
                "height": 800
            })

        entry = {
            "id": slugify(args.name),
            "conventionId": args.con,
            "booth": args.booth.upper().strip(),
            "name": args.name.strip(),
            "aliases": [],
            "summary": args.summary.strip(),
            "verified": bool(args.verified),
            "isNew": bool(args.new),
            "commissions": args.commissions.strip(),
            "socialLinks": social_links,
            "storeLinks": store_links,
            "catalogLinks": catalog_links,
            "series": series_list,
            "seriesConfirmed": series_list,
            "merch": merch_list,
            "images": images_list,
            "profileImage": args.profile_image.strip() or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
            "notes": args.notes.strip()
        }

    # Load existing artists
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            artists = json.load(f)
    else:
        artists = []

    # Update if exists, or append
    existing_idx = None
    target_id = entry.get("id") or slugify(entry.get("name", "artist"))
    entry["id"] = target_id

    for i, a in enumerate(artists):
        if a.get("conventionId") == entry.get("conventionId") and (
            a.get("id") == target_id or a.get("booth") == entry.get("booth")
        ):
            existing_idx = i
            break

    if existing_idx is not None:
        print(f"Updating existing entry for {entry['name']} (Booth {entry['booth']})...")
        artists[existing_idx].update(entry)
    else:
        print(f"Adding new entry for {entry['name']} (Booth {entry['booth']})...")
        artists.append(entry)

    # Save
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(artists, f, indent=2, ensure_ascii=False)

    print(f"Successfully saved to {DATA_FILE} (Total artists: {len(artists)})")

if __name__ == "__main__":
    main()
