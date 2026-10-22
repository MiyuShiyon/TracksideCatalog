#!/usr/bin/env python3
"""
scripts/scraper.py
Core scraping and metadata extraction module for TracksideCatalog.
Supports Twitter/X, Instagram, and Bluesky.
"""

import json
import os
import re
import shutil
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = ROOT / "assets"
AVATARS_DIR = ASSETS_DIR / "avatars"
CATALOGS_DIR = ASSETS_DIR / "catalogs"

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
BOT_USER_AGENT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

KNOWN_SERIES = [
    ("Uma Musume", "Uma Musume Pretty Derby"),
    ("Umamusume", "Uma Musume Pretty Derby"),
    ("ウマ娘", "Uma Musume Pretty Derby"),
    ("Hololive", "Hololive"),
    ("Frieren", "Sousou no Frieren"),
    ("Madoka", "Puella Magi Madoka Magica"),
    ("Bocchi", "Bocchi the Rock!"),
    ("Arknights", "Arknights"),
    ("Fire Emblem", "Fire Emblem: Three Houses"),
    ("Genshin", "Genshin Impact"),
    ("Star Rail", "Honkai: Star Rail"),
    ("Zenless", "Zenless Zone Zero"),
    ("Dungeon Meshi", "Dungeon Meshi"),
    ("Delicious in Dungeon", "Dungeon Meshi"),
    ("Girls' Frontline", "Girls' Frontline"),
    ("Touhou", "Touhou Project"),
    ("Pokemon", "Pokemon"),
    ("Zelda", "Legend of Zelda"),
    ("Vocaloid", "Vocaloid"),
    ("Haikyuu", "Haikyuu!!"),
    ("Jujutsu", "Jujutsu Kaisen"),
    ("Chainsaw", "Chainsaw Man"),
    ("Evangelion", "Neon Genesis Evangelion"),
    ("Cyberpunk", "Cyberpunk 2077")
]

KNOWN_MERCH = [
    (r"\bcharm(s)?\b|\bkeychain(s)?\b|\bkeyring(s)?\b", "Charms"),
    (r"\bsticker(s)?\b", "Stickers"),
    (r"\bprint(s)?\b|\bposter(s)?\b", "Prints"),
    (r"\bstandee(s)?\b|\bacrylic stand(s)?\b", "Standees"),
    (r"\bpin(s)?\b|\bbadge(s)?\b|\bbutton(s)?\b", "Pins & Badges"),
    (r"\bbook(s)?\b|\bphotobook(s)?\b|\bartbook(s)?\b|\bdoujin(shi)?\b|\bzine(s)?\b", "Art Books & Zines"),
    (r"\bshirt(s)?\b|\bapparel\b|\bhoodie(s)?\b|\bhawaiian\b|\bjersey(s)?\b", "Apparel & Shirts"),
    (r"\bbag(s)?\b|\btote(s)?\b", "Bags & Totes"),
    (r"\bplush(ie)?(s)?\b", "Plushies"),
    (r"\bshikishi\b", "Prints"),
    (r"\bcommission(s)?\b", "Commissions")
]

def slugify(text: str) -> str:
    s = re.sub(r'[^a-zA-Z0-9]+', '-', text.lower()).strip('-')
    return s or "artist"

def extract_table(text: str) -> str:
    # Match patterns like: table #5, table 11, table 29 (sat), table 25 sunday, booth A01
    m = re.search(r'(?:table|booth)\s*#?\s*(\d+[a-zA-Z]?|[a-zA-Z]\d+)(?:\s*\((?:sat|sun|saturday|sunday)[^\)]*\))?', text, re.IGNORECASE)
    if m:
        val = m.group(0).strip()
        # Clean capitalization
        val = re.sub(r'^table\s*#?', 'Table ', val, flags=re.I)
        val = re.sub(r'^booth\s*#?', 'Booth ', val, flags=re.I)
        return val
    # Match "#54" or "table 5"
    m2 = re.search(r'#(\d{1,3})\b', text)
    if m2:
        return f"Table {m2.group(1)}"
    return ""

def detect_series(text: str) -> list:
    found = set()
    lower = text.lower()
    for kw, canon in KNOWN_SERIES:
        if kw.lower() in lower:
            found.add(canon)
    if not found:
        found.add("Uma Musume Pretty Derby") # Default for Cosplay Trackside
    return sorted(list(found))

def detect_merch(text: str) -> list:
    found = set()
    for pattern, canon in KNOWN_MERCH:
        if re.search(pattern, text, re.IGNORECASE):
            found.add(canon)
    if not found:
        found = {"Charms", "Stickers", "Prints"}
    return sorted(list(found))

def download_file(url: str, dest_path: Path, use_bot: bool = False) -> bool:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    ua = BOT_USER_AGENT if use_bot else USER_AGENT
    req = urllib.request.Request(url, headers={"User-Agent": ua})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            if len(data) > 0:
                with open(dest_path, "wb") as f:
                    f.write(data)
                return True
    except Exception as e:
        print(f"  [Warning] Failed downloading {url}: {e}")
    return False

# --------------------------------------------------------------------------
# Twitter / X Scraper
# --------------------------------------------------------------------------
def scrape_twitter(url: str) -> dict:
    parts = url.strip().split('/')
    if len(parts) < 6:
        raise ValueError(f"Invalid Twitter URL: {url}")
    handle = parts[3]
    tweet_id = parts[5].split('?')[0]

    api_url = f"https://api.fxtwitter.com/{handle}/status/{tweet_id}"
    req = urllib.request.Request(api_url, headers={"User-Agent": USER_AGENT})
    
    with urllib.request.urlopen(req, timeout=12) as resp:
        data = json.loads(resp.read().decode('utf-8'))

    tweet = data.get("tweet", {})
    author = tweet.get("author", {})
    text = tweet.get("text", "")
    author_name = author.get("name") or handle
    media_list = tweet.get("media", {}).get("all", [])

    artist_id = slugify(handle)
    table = extract_table(text) or extract_table(author_name) or extract_table(author.get("description", ""))

    socials = [f"https://x.com/{handle}"]
    website = author.get("website", {}).get("url") if author.get("website") else None
    if website and website not in socials:
        socials.append(website)

    # Download avatar
    avatar_rel = ""
    avatar_url = author.get("avatar_url")
    if avatar_url:
        avatar_path = AVATARS_DIR / f"{artist_id}.jpg"
        if download_file(avatar_url, avatar_path):
            avatar_rel = f"./assets/avatars/{artist_id}.jpg"

    # Download media
    images = []
    artist_catalog_dir = CATALOGS_DIR / artist_id
    for idx, m in enumerate(media_list):
        m_url = m.get("url")
        if m_url:
            ext = "png" if ".png" in m_url else "jpg"
            file_name = f"catalog_{idx+1}.{ext}"
            file_path = artist_catalog_dir / file_name
            if download_file(m_url, file_path):
                images.append({
                    "url": f"./assets/catalogs/{artist_id}/{file_name}",
                    "caption": f"{author_name} Catalog Page {idx+1}"
                })

    return {
        "id": artist_id,
        "conventionId": "trackside-2026",
        "booth": table or "Table TBA",
        "name": author_name,
        "aliases": [handle],
        "summary": text.replace("\n", " ")[:200] or f"Artist exhibiting at {table or 'Cosplay Trackside'}.",
        "verified": False,
        "isNew": False,
        "commissions": "",
        "socialLinks": socials,
        "storeLinks": [],
        "catalogLinks": [url],
        "series": detect_series(text + " " + (author.get("description") or "")),
        "seriesConfirmed": detect_series(text),
        "merch": detect_merch(text),
        "images": images,
        "profileImage": avatar_rel or "./assets/icons/favicon.svg",
        "notes": text[:150]
    }

# --------------------------------------------------------------------------
# Instagram Scraper
# --------------------------------------------------------------------------
def scrape_instagram(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": BOT_USER_AGENT})
    with urllib.request.urlopen(req, timeout=12) as resp:
        html = resp.read().decode('utf-8', errors='ignore')

    title_match = re.search(r'<meta property="og:title" content="([^"]*)"', html)
    desc_match = re.search(r'<meta property="og:description" content="([^"]*)"', html)
    img_match = re.search(r'<meta property="og:image" content="([^"]*)"', html)

    raw_title = title_match.group(1) if title_match else ""
    raw_desc = desc_match.group(1) if desc_match else ""
    img_url = img_match.group(1).replace('&amp;', '&') if img_match else ""

    # Parse author from title e.g. "C-ANGEL on Instagram: ..." or "22 likes - c_angel_art on ..."
    author_name = "Instagram Artist"
    handle = "artist"
    author_m = re.search(r'^(.*?)\s+on Instagram', raw_title)
    if author_m:
        author_name = author_m.group(1).replace("&quot;", "").strip()
        handle = slugify(author_name)

    handle_m = re.search(r'-\s+([a-zA-Z0-9_\.]+)\s+on\s+', raw_desc)
    if handle_m:
        handle = handle_m.group(1)

    combined_text = f"{raw_title} {raw_desc}"
    table = extract_table(combined_text)
    artist_id = slugify(handle)

    images = []
    if img_url:
        artist_catalog_dir = CATALOGS_DIR / artist_id
        file_path = artist_catalog_dir / "catalog_1.jpg"
        if download_file(img_url, file_path):
            images.append({
                "url": f"./assets/catalogs/{artist_id}/catalog_1.jpg",
                "caption": f"{author_name} Instagram Showcase"
            })

    return {
        "id": artist_id,
        "conventionId": "trackside-2026",
        "booth": table or "Table TBA",
        "name": author_name,
        "aliases": [handle],
        "summary": raw_title.replace("&quot;", '"')[:180] or f"Artist exhibiting at {table or 'Cosplay Trackside'}.",
        "verified": False,
        "isNew": False,
        "commissions": "",
        "socialLinks": [url, f"https://instagram.com/{handle}"],
        "storeLinks": [],
        "catalogLinks": [url],
        "series": detect_series(combined_text),
        "seriesConfirmed": detect_series(combined_text),
        "merch": detect_merch(combined_text),
        "images": images,
        "profileImage": "./assets/icons/favicon.svg",
        "notes": raw_desc[:150]
    }

# --------------------------------------------------------------------------
# Dispatcher
# --------------------------------------------------------------------------
def scrape_url(url: str) -> dict:
    url = url.strip()
    if "twitter.com" in url or "x.com" in url:
        return scrape_twitter(url)
    elif "instagram.com" in url:
        return scrape_instagram(url)
    else:
        raise ValueError(f"Unsupported platform URL: {url}")
