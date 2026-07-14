import requests

from config import (
    POSTERS_DIR,
    BACKGROUNDS_DIR,
    TMDB_IMAGE_BASE,
    TMDB_POSTER_SIZE,
    TMDB_BACKDROP_SIZE,
    REQUEST_TIMEOUT,
)


def _download(url, dest_path):
    resp = requests.get(url, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    dest_path.write_bytes(resp.content)


def ensure_poster(slug, poster_path):
    """Descarrega o poster para public/posters/{slug}.png, so se ainda nao existir."""
    dest = POSTERS_DIR / f"{slug}.png"
    if dest.exists() or not poster_path:
        return False
    _download(f"{TMDB_IMAGE_BASE}/{TMDB_POSTER_SIZE}{poster_path}", dest)
    return True


def ensure_backdrop(slug, backdrop_path):
    """Descarrega o backdrop para public/backgrounds/{slug}.png, so se ainda nao existir."""
    dest = BACKGROUNDS_DIR / f"{slug}.png"
    if dest.exists() or not backdrop_path:
        return False
    _download(f"{TMDB_IMAGE_BASE}/{TMDB_BACKDROP_SIZE}{backdrop_path}", dest)
    return True
