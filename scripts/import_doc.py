#!/usr/bin/env python3
"""
scripts/import_doc.py
Parses text files, markdown lists, or CSVs containing artist submissions
and appends/updates data/artists.json.

Format supported:
  - Markdown lists / tables:
    | Booth | Name | Social / Twitter | Series / Fandoms | Merch |
  - Or unstructured text blocks:
    Booth: A05
    Artist: Starlight Circle
    Twitter: https://x.com/starlight
    Series: Genshin Impact, Honkai
    Merch: Prints, Charms
"""

import json
import re
import sys
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "artists.json"

def parse_text_blocks(text: str, convention_id: str = "trackside-2026"):
    blocks = re.split(r'\n\s*\n', text.strip())
    parsed = []
    
    for b in blocks:
        lines = [l.strip() for l in b.splitlines() if l.strip()]
        if not lines:
            continue
        
        info = {
            "name": "",
            "booth": "",
            "summary": "",
            "socialLinks": [],
            "catalogLinks": [],
            "series": [],
            "merch": [],
            "commissions": "",
            "verified": False,
            "isNew": False
        }
        
        for line in lines:
            if ":" in line:
                k, v = line.split(":", 1)
                k = k.lower().strip()
                v = v.strip()
                if "booth" in k or "table" in k:
                    info["booth"] = v.upper()
                elif "artist" in k or "name" in k or "circle" in k:
                    info["name"] = v
                elif "twitter" in k or "x.com" in k or "social" in k or "link" in k:
                    if "status/" in v:
                        info["catalogLinks"].append(v)
                    info["socialLinks"].append(v)
                elif "series" in k or "fandom" in k:
                    info["series"] = [s.strip() for s in v.split(",") if s.strip()]
                elif "merch" in k or "products" in k:
                    info["merch"] = [m.strip() for m in v.split(",") if m.strip()]
                elif "commission" in k:
                    info["commissions"] = v
                elif "bio" in k or "summary" in k or "desc" in k:
                    info["summary"] = v
        
        if info["name"] and info["booth"]:
            slug = re.sub(r'[^a-zA-Z0-9]+', '-', info["name"].lower()).strip('-')
            entry = {
                "id": slug,
                "conventionId": convention_id,
                "booth": info["booth"],
                "name": info["name"],
                "aliases": [],
                "summary": info["summary"] or f"Artist exhibiting at booth {info['booth']}.",
                "verified": info["verified"],
                "isNew": info["isNew"],
                "commissions": info["commissions"],
                "socialLinks": info["socialLinks"],
                "storeLinks": [],
                "catalogLinks": info["catalogLinks"],
                "series": info["series"],
                "seriesConfirmed": info["series"],
                "merch": info["merch"],
                "images": [],
                "profileImage": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
                "notes": ""
            }
            parsed.append(entry)
            
    return parsed

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/import_doc.py <path_to_doc.txt> [convention_id]")
        sys.exit(1)

    file_path = Path(sys.argv[1])
    con_id = sys.argv[2] if len(sys.argv) > 2 else "trackside-2026"

    if not file_path.exists():
        print(f"File not found: {file_path}", file=sys.stderr)
        sys.exit(1)

    text = file_path.read_text(encoding="utf-8")
    entries = parse_text_blocks(text, con_id)

    if not entries:
        print("No valid artist blocks found in document.")
        return

    # Load existing
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            artists = json.load(f)
    else:
        artists = []

    existing_map = {(a.get("conventionId"), a.get("booth")): i for i, a in enumerate(artists)}
    added = 0
    updated = 0

    for e in entries:
        key = (e["conventionId"], e["booth"])
        if key in existing_map:
            artists[existing_map[key]].update(e)
            updated += 1
        else:
            artists.append(e)
            existing_map[key] = len(artists) - 1
            added += 1

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(artists, f, indent=2, ensure_ascii=False)

    print(f"Successfully processed {len(entries)} entries! Added: {added}, Updated: {updated}. Total artists in db: {len(artists)}")

if __name__ == "__main__":
    main()
