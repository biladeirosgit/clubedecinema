import requests

from config import TMDB_API_TOKEN, TMDB_API_BASE, REQUEST_TIMEOUT


def fetch_movie(tmdb_id):
    """Devolve {poster_path, backdrop_path, genres, minutes} ou None se nao existir/erro."""
    if not TMDB_API_TOKEN:
        raise RuntimeError("TMDB_API_TOKEN nao definido (variavel de ambiente)")

    resp = requests.get(
        f"{TMDB_API_BASE}/movie/{tmdb_id}",
        params={"api_key": TMDB_API_TOKEN, "language": "en-US"},
        timeout=REQUEST_TIMEOUT,
    )
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    data = resp.json()

    return {
        "poster_path": data.get("poster_path"),
        "backdrop_path": data.get("backdrop_path"),
        "genres": [g["name"] for g in data.get("genres", [])],
        "minutes": data.get("runtime"),
    }
