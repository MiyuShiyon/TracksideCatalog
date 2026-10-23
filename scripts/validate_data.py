#!/usr/bin/env python3
"""
scripts/validate_data.py
Validates the data integrity of artists.json, rallies.json, and conventions.json.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "data"

def check():
    errors = []
    
    # Conventions
    con_file = ROOT / "conventions.json"
    if not con_file.exists():
        errors.append("conventions.json missing!")
        conventions = []
    else:
        with open(con_file, "r", encoding="utf-8") as f:
            conventions = json.load(f)
    
    con_ids = {c["id"] for c in conventions}
    print(f"Loaded {len(conventions)} conventions: {', '.join(con_ids)}")

    # Artists
    art_file = ROOT / "artists.json"
    if not art_file.exists():
        errors.append("artists.json missing!")
    else:
        with open(art_file, "r", encoding="utf-8") as f:
            artists = json.load(f)
        
        seen_keys = set()
        for i, a in enumerate(artists):
            cid = a.get("conventionId")
            booth = a.get("booth")
            name = a.get("name")
            if not cid or cid not in con_ids:
                errors.append(f"Artist #{i} ({name}) has invalid conventionId: '{cid}'")
            if not booth:
                errors.append(f"Artist #{i} ({name}) is missing booth!")
            if not name:
                errors.append(f"Artist #{i} is missing name!")
            
            key = (cid, booth)
            if not booth.upper().startswith("TABLE TBA") and key in seen_keys:
                errors.append(f"Duplicate booth '{booth}' in convention '{cid}' for artist '{name}'")
            seen_keys.add(key)
        
        print(f"Loaded {len(artists)} artists across all conventions.")

    # Rallies
    ral_file = ROOT / "rallies.json"
    if not ral_file.exists():
        errors.append("rallies.json missing!")
    else:
        with open(ral_file, "r", encoding="utf-8") as f:
            rallies = json.load(f)
        print(f"Loaded {len(rallies)} stamp rallies.")

    if errors:
        print("\nERRORS FOUND:")
        for e in errors:
            print(f" - {e}")
        sys.exit(1)
    else:
        print("\nAll data validation checks passed successfully!")

if __name__ == "__main__":
    check()
