import json
import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
ARTISTS_FILE = DATA_DIR / "artists.json"
ASSETS_DIR = ROOT / "assets"
CATALOGS_DIR = ASSETS_DIR / "catalogs"
AVATARS_DIR = ASSETS_DIR / "avatars"
TEMP_DIR = ROOT / "temp_images"

CATALOGS_DIR.mkdir(parents=True, exist_ok=True)
AVATARS_DIR.mkdir(parents=True, exist_ok=True)

# 1. Load existing artists (keep angryforks)
with open(ARTISTS_FILE, "r", encoding="utf-8") as f:
    existing_artists = json.load(f)

# Keep angryforks
artists_map = {a["id"]: a for a in existing_artists}

# Helper to copy avatar
def setup_avatar(temp_handle, artist_id):
    src = TEMP_DIR / temp_handle / "avatar.jpg"
    dest = AVATARS_DIR / f"{artist_id}.jpg"
    if src.exists():
        shutil.copy2(src, dest)
        return f"./assets/avatars/{artist_id}.jpg"
    return "./assets/icons/favicon.svg"

# Helper to copy catalogs
def setup_catalogs(temp_handle, artist_id, captions):
    src_folder = TEMP_DIR / temp_handle
    dest_folder = CATALOGS_DIR / artist_id
    dest_folder.mkdir(parents=True, exist_ok=True)
    images = []
    if src_folder.exists():
        files = sorted([f for f in os.listdir(src_folder) if f.startswith("catalog_")])
        for idx, f in enumerate(files):
            src_f = src_folder / f
            dest_f = dest_folder / f
            shutil.copy2(src_f, dest_f)
            caption = captions[idx] if idx < len(captions) else f"Catalog Page {idx+1}"
            images.append({
                "url": f"./assets/catalogs/{artist_id}/{f}",
                "caption": caption
            })
    return images

# Define all 21 new vendors
vendors = [
    {
        "id": "mikou-art",
        "temp_handle": "mikou_art",
        "name": "Mikou_art",
        "booth": "Table 11",
        "aliases": ["mikou", "mikou_cosplay"],
        "summary": "Illustrator creating cute cat art, posters, and Uma Musume photobooks for Cosplay Trackside. Exhibiting both days at Table 11!",
        "socialLinks": [
            "https://x.com/mikou_art",
            "https://linktr.ee/mikouart"
        ],
        "catalogLinks": ["https://x.com/mikou_art/status/2112982874169487437"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby", "Original"],
        "merch": ["Prints", "Art Books & Zines", "Charms", "Stickers"],
        "captions": ["Uma Musume Pretty Derby Catalog & Photobook Showcase"],
        "notes": "Bringing posters and photobook! At Table 11 both days."
    },
    {
        "id": "pillow",
        "temp_handle": "PillowMakura",
        "name": "Pillow",
        "booth": "Table 54",
        "aliases": ["PillowMakura", "PillowIllust"],
        "summary": "Illustrator tabling at Cosplay Trackside Table #54 Oct 24-25. Original shikishis, Uma Musume art, and prints.",
        "socialLinks": [
            "https://x.com/PillowMakura",
            "http://pillowillust.carrd.co",
            "http://www.pixiv.net/en/users/17091483",
            "http://vgen.co/PillowIllust"
        ],
        "catalogLinks": ["https://x.com/pillowmakura/status/2112685368692855290"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby", "Original"],
        "merch": ["Prints", "Charms", "Standees", "Commissions"],
        "captions": ["Cosplay Trackside Table #54 Catalog & Shikishi Board Previews"],
        "notes": "Will have custom hand-drawn shikishis and non-Uma goods. Japanese/English OK!"
    },
    {
        "id": "venatto",
        "temp_handle": "Venatto",
        "name": "ヴェント🍱 (Vento)",
        "booth": "Table 15",
        "aliases": ["Venatto", "VentoBento"],
        "summary": "Illustrator & manga artist at table 15 both days! Uma Musume goods, prints, Arknights, and shikishi sketches.",
        "socialLinks": [
            "https://x.com/Venatto",
            "https://potofu.me/ventobento"
        ],
        "catalogLinks": ["https://x.com/venatto/status/2112627112029102278"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby", "Arknights", "Girls' Frontline", "Touhou Project"],
        "merch": ["Prints", "Charms", "Standees", "Stickers"],
        "captions": [
            "Uma Musume Character Prints & Charms",
            "Shikishi & Art Showcase Page 2",
            "Stickers & Mini Prints"
        ],
        "notes": "Tabling both days at table 15. Hand-drawn shikishis available if time permits!"
    },
    {
        "id": "napopk",
        "temp_handle": "napopk",
        "name": "jinnsae 🐙",
        "booth": "Table 4",
        "aliases": ["napopk", "pechehouse"],
        "summary": "Umamusume cosplay trackside catalog! Acrylic charms, badges, and prints at table #4 both days.",
        "socialLinks": [
            "https://x.com/napopk",
            "https://vgen.co/napopk",
            "https://instagram.com/pechehouse"
        ],
        "catalogLinks": ["https://x.com/napopk/status/2112346875424854098"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby"],
        "merch": ["Charms", "Pins & Badges", "Prints", "Stickers"],
        "captions": [
            "Uma Musume Double-Sided Acrylic Charms",
            "Button Badges & Pin Collection",
            "Foil & Glossy Art Prints",
            "Die-Cut Vinyl Stickers"
        ],
        "notes": "Table #4 both days. Featuring a wide selection of Uma Musume merch!"
    },
    {
        "id": "tohoho-events",
        "temp_handle": "tohoho_events",
        "name": "tohoho_events",
        "booth": "Table 30",
        "aliases": ["tohoho"],
        "summary": "A group of artists curating fan events and merch for our beloved oshis. Table 30 on Sunday-only! Every purchase gets a free Anitan sticker until supplies end.",
        "socialLinks": [
            "https://x.com/tohoho_events",
            "https://tohohoevents.carrd.co/#artists"
        ],
        "catalogLinks": ["https://x.com/tohoho_events/status/2112339609665384901"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby"],
        "merch": ["Charms", "Stickers", "Pins & Badges", "Prints"],
        "captions": [
            "Cosplay Trackside Sunday Catalogue Page 1",
            "Acrylic Charms & Keychains Page 2",
            "Free Anitan Sticker & Exclusive Goods"
        ],
        "notes": "Sunday-only at Table 30! Every purchase receives a free Anitan sticker while supplies last."
    },
    {
        "id": "badsprite",
        "temp_handle": "BadSprite",
        "name": "BadSprite / SnakeberryArt",
        "booth": "Table 55",
        "aliases": ["BadSprite", "SnakeberryArt"],
        "summary": "Friends tabling together under SnakeberryArt at table #55 both Saturday and Sunday! Acrylic charms, stickers, and art prints.",
        "socialLinks": [
            "https://x.com/BadSprite",
            "https://badsprite.itch.io/"
        ],
        "catalogLinks": ["https://x.com/badsprite/status/2112244735658414233"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby", "Original"],
        "merch": ["Charms", "Stickers", "Prints"],
        "captions": [
            "SnakeberryArt / BadSprite Catalog - Page 1",
            "Acrylic Charms & Stickers - Page 2"
        ],
        "notes": "Tabling at Table #55 under the circle name SnakeberryArt both days!"
    },
    {
        "id": "boukensha-c",
        "temp_handle": "boukensha_c",
        "name": "冒険者C (Boukensha C)",
        "booth": "Table 18",
        "aliases": ["boukensha_c", "Boukensha C"],
        "summary": "Game fan artist tabling at table #18 for Cosplay Trackside Oct 24-25. Uma Musume art books, doujinshi, acrylic goods, and prints.",
        "socialLinks": [
            "https://x.com/boukensha_c",
            "https://www.pixiv.net/users/29874909",
            "https://twpf.jp/boukensha_c"
        ],
        "catalogLinks": ["https://x.com/boukensha_c/status/2111932924958548439"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby"],
        "merch": ["Art Books & Zines", "Prints", "Charms", "Stickers"],
        "captions": [
            "Uma Musume Doujinshi & Artbook Catalog",
            "Character Charms & Art Goods"
        ],
        "notes": "Table #18 both days! Japanese and English inquiries welcome."
    },
    {
        "id": "zhajiang",
        "temp_handle": "zhajiang_",
        "name": "炸酱 (Zhajiang)",
        "booth": "Table 29 (Sat)",
        "aliases": ["zhajiang_", "Zhajiang"],
        "summary": "Tabling at table #29 Saturday only. Uma Musume die-cut stickers, acrylic standees, and charms.",
        "socialLinks": [
            "https://x.com/zhajiang_",
            "https://zhajiang.carrd.co/"
        ],
        "catalogLinks": ["https://x.com/zhajiang_/status/2111886026067112264"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby"],
        "merch": ["Standees", "Charms", "Stickers"],
        "captions": ["Cosplay Trackside Saturday Table #29 Catalog"],
        "notes": "Saturday ONLY at Table #29! Sharing table with bonebitten (who tables Sunday)."
    },
    {
        "id": "lucha-dosukoi",
        "temp_handle": "Lucha_Dosukoi",
        "name": "Lucha Dosukoi",
        "booth": "Table 43",
        "aliases": ["Lucha_Dosukoi", "Lucha Dosukoi SSSR"],
        "summary": "Tabling at table 43 on October 24 and 25 at Cosplay Trackside. Uma Musume streetwear apparel, graphic tees, charms, and stickers.",
        "socialLinks": [
            "https://x.com/Lucha_Dosukoi",
            "https://linktr.ee/lucha.dosukoi"
        ],
        "catalogLinks": ["https://x.com/lucha_dosukoi/status/2111716541150728250"],
        "storeLinks": ["https://luchadosukoisssr.bigcartel.com"],
        "series": ["Uma Musume Pretty Derby"],
        "merch": ["Apparel & Shirts", "Charms", "Stickers"],
        "captions": ["Cosplay Trackside Table 43 Full Merchandise Catalog"],
        "notes": "At Table 43 both Saturday and Sunday! Stop by and hang out."
    },
    {
        "id": "mijudraws",
        "temp_handle": "mijudraws",
        "name": "Miju 🌠",
        "booth": "Table 20",
        "aliases": ["mijudraws", "Miju"],
        "summary": "At table #20 for Cosplay Trackside at Santa Anita Park on Oct 24-25. Uma Musume holographic charms, stickers, and mini prints.",
        "socialLinks": [
            "https://x.com/mijudraws",
            "https://miju.moe"
        ],
        "catalogLinks": ["https://x.com/mijudraws/status/2111678168633684275"],
        "storeLinks": ["https://store.miju.moe"],
        "series": ["Uma Musume Pretty Derby"],
        "merch": ["Charms", "Stickers", "Prints"],
        "captions": ["Uma Musume Holographic Acrylic Charms & Stickers Menu"],
        "notes": "Table #20 both days at Santa Anita Park! Sharing table space with VinoBurrito (#19)."
    },
    {
        "id": "just-peemy",
        "temp_handle": "just_peemy",
        "name": "peemi",
        "booth": "Table 24",
        "aliases": ["just_peemy", "peemydayo"],
        "summary": "Very excited to be back in Santa Anita at table #24! Acrylic charms, foil prints, stickers, and stamp rally participant.",
        "socialLinks": [
            "https://x.com/just_peemy",
            "http://peemydayo.carrd.co"
        ],
        "catalogLinks": ["https://x.com/just_peemy/status/2111600456615051534"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby"],
        "merch": ["Charms", "Prints", "Stickers", "Pins & Badges"],
        "captions": [
            "Catalogue Page 1 - Character Charms",
            "Catalogue Page 2 - Foil Prints & Art",
            "Catalogue Page 3 - Badges & Stamp Rally Info"
        ],
        "notes": "Table #24 both days. Participating in the event stamp rallies!"
    },
    {
        "id": "bonebitten",
        "temp_handle": "bonebitten",
        "name": "c (bonebitten)",
        "booth": "Table 29 (Sun)",
        "aliases": ["bonebitten"],
        "summary": "Cosplay Trackside catalog for Sunday Oct 25th at table #29. First time selling art: Uma Musume charms, meme stickers, and prints.",
        "socialLinks": [
            "https://x.com/bonebitten",
            "https://bonebitten.straw.page"
        ],
        "catalogLinks": ["https://x.com/bonebitten/status/2110799617365361107"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby", "Original"],
        "merch": ["Charms", "Stickers", "Prints"],
        "captions": [
            "Sunday Oct 25th Table #29 Catalog - Page 1",
            "Acrylic Charms & Keychains - Page 2",
            "Sticker Packs & Prints - Page 3"
        ],
        "notes": "Sunday ONLY at Table #29! First-time exhibitor!"
    },
    {
        "id": "mintybytes",
        "temp_handle": "mintybytes",
        "name": "yayi (mintybytes)",
        "booth": "Table 31",
        "aliases": ["mintybytes", "mintybytes_art"],
        "summary": "At table 31 for Sunday only at Cosplay Trackside! Uma Musume acrylic standees, charms, enamel pins, and stickers.",
        "socialLinks": [
            "https://x.com/mintybytes",
            "https://linktr.ee/mintybytes"
        ],
        "catalogLinks": ["https://x.com/mintybytes/status/2110427717334356171"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby"],
        "merch": ["Standees", "Charms", "Stickers", "Pins & Badges"],
        "captions": [
            "Sunday-Only Table 31 Catalog - Page 1",
            "Acrylic Standees & Keyrings - Page 2",
            "Stickers & Pin Badges - Page 3"
        ],
        "notes": "Table 31 for SUNDAY ONLY! English & Spanish OK."
    },
    {
        "id": "gachaloha",
        "temp_handle": "GachalohaSHIRTS",
        "name": "Gachaloha",
        "booth": "Vendor Booth",
        "aliases": ["GachalohaSHIRTS", "Gachaloha"],
        "summary": "Tropical apparel inspired by Uma Musume. Hawaiian shirts, jerseys, toploaders, hats, and pins. Official vendor both days at Cosplay Trackside.",
        "socialLinks": [
            "https://x.com/GachalohaSHIRTS",
            "https://instagram.com/gachaloha"
        ],
        "catalogLinks": ["https://x.com/gachalohashirts/status/2108623226246967528"],
        "storeLinks": ["http://gachaloha.com"],
        "series": ["Uma Musume Pretty Derby"],
        "merch": ["Apparel & Shirts", "Pins & Badges", "Stickers", "Bags & Totes"],
        "captions": ["Gachaloha Vendor Booth Banner - 4 Brand New Uma Shirts & Accessories"],
        "notes": "Official vendor both days! Showcasing 4 brand-new designs plus stock of all previous Uma shirts."
    },
    {
        "id": "suaviterra",
        "temp_handle": "suaviterra",
        "name": "LAYER (suaviterra)",
        "booth": "Table 17",
        "aliases": ["suaviterra", "LAYER"],
        "summary": "Attending both Sat and Sun at table #17. Uma Musume holographic charms, prints, and stickers.",
        "socialLinks": [
            "https://x.com/suaviterra",
            "http://patreon.com/suaviterra"
        ],
        "catalogLinks": ["https://x.com/suaviterra/status/2107704520482644326"],
        "storeLinks": ["https://www.etsy.com/shop/suaviterra"],
        "series": ["Uma Musume Pretty Derby"],
        "merch": ["Charms", "Prints", "Stickers"],
        "captions": [
            "Cosplay Trackside Table 17 Catalogue - Page 1",
            "Charms, Prints, and Stickers - Page 2"
        ],
        "notes": "Attending both Saturday and Sunday at Table #17!"
    },
    {
        "id": "houyahafu",
        "temp_handle": "HouyaHafu",
        "name": "Houya / ほうや",
        "booth": "Table 16",
        "aliases": ["HouyaHafu", "Houya", "h0uya_583"],
        "summary": "Santa Anita Cosplay Trackside Menu at Table 16. Showagumi characters, art books, shikishi boards, acrylic charms, and postcards.",
        "socialLinks": [
            "https://x.com/HouyaHafu",
            "https://linktr.ee/houyahafu",
            "http://patreon.com/houyahafu"
        ],
        "catalogLinks": ["https://x.com/houyahafu/status/2107632763369386285"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby"],
        "merch": ["Art Books & Zines", "Charms", "Prints", "Stickers"],
        "captions": [
            "Cosplay Trackside Table 16 Catalogue Cover",
            "Artbooks & Illustration Collections",
            "Acrylic Charms & Postcards Collection",
            "Showagumi Special Shikishi Boards"
        ],
        "notes": "Table 16 both days! First time tabling in the US! No pre-orders, arrive early."
    },
    {
        "id": "cdrosenn",
        "temp_handle": "CDRosenn",
        "name": "Corey (CDRosenn)",
        "booth": "Table 22",
        "aliases": ["CDRosenn", "Corey Rosenn"],
        "summary": "At table #22 for Cosplay Trackside on Saturday and Sunday. Fashion magazine style anime & Uma Musume covers and metallic foil prints.",
        "socialLinks": [
            "https://x.com/CDRosenn",
            "https://rosenn.carrd.co/"
        ],
        "catalogLinks": ["https://x.com/CDRosenn/status/2113050139078398383"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby", "Anime", "VTubers"],
        "merch": ["Prints", "Charms", "Art Books & Zines"],
        "captions": [
            "Fashion Magazine Style Uma Prints - Page 1",
            "Art Prints & Charms Menu - Page 2"
        ],
        "notes": "At Table #22 both Saturday and Sunday! Stop by to check out the prints."
    },
    {
        "id": "c-angel",
        "temp_handle": "c_angel_art",
        "name": "C-ANGEL (Valerie)",
        "booth": "Table 42",
        "aliases": ["c_angel_art", "CAngelShop", "C-ANGEL"],
        "summary": "Vending at Cosplay Trackside this Saturday! Ton of new Uma Musume charms, keychains, and die-cut stickers.",
        "socialLinks": [
            "https://instagram.com/c_angel_art"
        ],
        "catalogLinks": ["https://www.instagram.com/p/Dexz9I-mg6B/"],
        "storeLinks": ["https://www.etsy.com/shop/CAngelShop"],
        "series": ["Uma Musume Pretty Derby"],
        "merch": ["Charms", "Stickers", "Keychains"],
        "captions": ["Cosplay Trackside Saturday Uma Charms & Stickers Menu"],
        "notes": "Vending this Saturday! Packed with brand-new Uma Musume charms."
    },
    {
        "id": "vinoburrito",
        "temp_handle": "vinoburrito",
        "name": "VinoBurrito",
        "booth": "Table 19",
        "aliases": ["vinoburrito"],
        "summary": "At Table 19 sharing a space with @mijudraws at Cosplay Trackside! Uma Musume charms, badges, and stickers.",
        "socialLinks": [
            "https://instagram.com/vinoburrito"
        ],
        "catalogLinks": ["https://www.instagram.com/p/DeuPXeeGyIE/"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby"],
        "merch": ["Charms", "Stickers", "Pins & Badges"],
        "captions": ["Cosplay Trackside Table 19 Catalog - Uma Musume Goodies"],
        "notes": "Find me at Table 19, sharing space with @mijudraws (#20)!"
    },
    {
        "id": "iyeun",
        "temp_handle": "iyeun",
        "name": "iyeun",
        "booth": "Table 25",
        "aliases": ["iy.eun", "iyeun"],
        "summary": "Cosplay Trackside catalog at Table #25 Sunday. Debut of 'Change of Pace' Artbook, metallic luster prints, satin prints, and freebie small prints.",
        "socialLinks": [
            "https://instagram.com/iy.eun"
        ],
        "catalogLinks": ["https://www.instagram.com/p/Deug3zwlnSB/"],
        "storeLinks": [],
        "series": ["Uma Musume Pretty Derby", "Original"],
        "merch": ["Art Books & Zines", "Prints"],
        "captions": ["Exclusive Debut: 'Change of Pace' Artbook & Print Collection"],
        "notes": "Table #25 Sunday! Free satin print for anyone, unlimited free small/B-grade prints for customers."
    },
    {
        "id": "posebean",
        "temp_handle": "posebean",
        "name": "posebean",
        "booth": "Table 12",
        "aliases": ["posebean", "umabean"],
        "summary": "At Cosplay Trackside for an umatastic time! All bugsumes, hungry umas charms, stickers, and porb adoptions.",
        "socialLinks": [
            "https://instagram.com/posebean"
        ],
        "catalogLinks": ["https://www.instagram.com/p/Dem0Q1jD7TJ/"],
        "storeLinks": ["https://posebean.bigcartel.com/"],
        "series": ["Uma Musume Pretty Derby", "Original"],
        "merch": ["Charms", "Stickers", "Plushies"],
        "captions": ["Porb Adoptions, Bugsumes, and Hungry Umas Charms Menu"],
        "notes": "Freebie trade for people who tell me their favorite Uma!"
    }
]

# Process and append each vendor
for v in vendors:
    aid = v["id"]
    temp_h = v["temp_handle"]
    
    avatar_path = setup_avatar(temp_h, aid)
    catalog_images = setup_catalogs(temp_h, aid, v["captions"])
    
    entry = {
        "id": aid,
        "conventionId": "trackside-2026",
        "booth": v["booth"],
        "name": v["name"],
        "aliases": v["aliases"],
        "summary": v["summary"],
        "verified": False,
        "isNew": False,
        "commissions": "",
        "socialLinks": v["socialLinks"],
        "storeLinks": v["storeLinks"],
        "catalogLinks": v["catalogLinks"],
        "series": v["series"],
        "seriesConfirmed": v["series"],
        "merch": v["merch"],
        "images": catalog_images,
        "profileImage": avatar_path,
        "notes": v["notes"]
    }
    
    artists_map[aid] = entry

# Save all artists
final_artists = list(artists_map.values())
with open(ARTISTS_FILE, "w", encoding="utf-8") as f:
    json.dump(final_artists, f, indent=2, ensure_ascii=False)

print(f"Successfully saved {len(final_artists)} artists to {ARTISTS_FILE}!")

# Update conventions.json map for 60 tables
CON_FILE = DATA_DIR / "conventions.json"
with open(CON_FILE, "r", encoding="utf-8") as f:
    conventions = json.load(f)

for c in conventions:
    if c["id"] == "trackside-2026":
        c["map"] = {
            "type": "numbered",
            "totalTables": 60,
            "tablesPerRow": 5,
            "sections": [
                { "name": "Front Hall (Tables 1-20)", "range": [1, 20], "color": "#ff544a44", "borderColor": "#ff544a", "label": "Front" },
                { "name": "Central Hall (Tables 21-40)", "range": [21, 40], "color": "#76edff44", "borderColor": "#76edff", "label": "Central" },
                { "name": "Back Plaza (Tables 41-60)", "range": [41, 60], "color": "#ffca4a44", "borderColor": "#ffca4a", "label": "Back" }
            ]
        }

with open(CON_FILE, "w", encoding="utf-8") as f:
    json.dump(conventions, f, indent=2, ensure_ascii=False)

print("Updated conventions.json map layout to 60 tables.")
