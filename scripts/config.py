import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

MAIN_LIST_URL = "https://letterboxd.com/surumkata/list/clube-de-cinema/"
WHEEL_LIST_URL = "https://letterboxd.com/surumkata/list/wheel-clube-de-cinema/"

CINEMA_DATA_PATH = ROOT / "src" / "cdc" / "cinemaData.json"
WHEEL_DATA_PATH = ROOT / "src" / "cdc" / "wheelData.json"
MEMBERS_PATH = ROOT / "scripts" / "members.json"
WEEK_META_PATH = ROOT / "scripts" / "weekMeta.json"
WHEEL_SELECTIONS_PATH = ROOT / "scripts" / "wheelSelections.json"
MANUAL_RATINGS_PATH = ROOT / "scripts" / "manualRatings.json"

POSTERS_DIR = ROOT / "public" / "posters"
BACKGROUNDS_DIR = ROOT / "public" / "backgrounds"

TMDB_API_TOKEN = os.environ.get("TMDB_API_TOKEN")
TMDB_API_BASE = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"
TMDB_POSTER_SIZE = "w500"
TMDB_BACKDROP_SIZE = "w1280"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)

# Delay entre pedidos ao Letterboxd (segundos), para nao martelar o site.
REQUEST_DELAY_RANGE = (0.5, 1.5)
REQUEST_TIMEOUT = 15
MAX_RETRIES = 3
