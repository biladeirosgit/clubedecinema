import re
import time
import unicodedata

import requests

from config import TMDB_API_TOKEN, TMDB_API_BASE, REQUEST_TIMEOUT

# Elenco guardado por filme de fora do clube: chega para os "atores
# preferidos" e nao incha o JSON com figurantes de centenas de filmes.
OUTSIDE_CAST_LIMIT = 10


def fetch_movie(tmdb_id):
    """Devolve {poster_path, backdrop_path, genres, minutes, collection} ou None se
    nao existir/erro. `collection` e o nome da saga (sem o sufixo " Collection") ou
    None — vem no mesmo pedido, nao custa nada."""
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

    collection = data.get("belongs_to_collection")
    collection_name = None
    if collection and collection.get("name"):
        collection_name = re.sub(r"\s+Collection$", "", collection["name"])

    return {
        "poster_path": data.get("poster_path"),
        "backdrop_path": data.get("backdrop_path"),
        "genres": [g["name"] for g in data.get("genres", [])],
        "minutes": data.get("runtime"),
        "collection": collection_name,
    }


def _get(path, **params):
    """GET a API do TMDB. None em 404; espera e tenta outra vez no 429 (limite
    de pedidos)."""
    if not TMDB_API_TOKEN:
        raise RuntimeError("TMDB_API_TOKEN nao definido (variavel de ambiente)")
    for attempt in range(3):
        resp = requests.get(
            f"{TMDB_API_BASE}{path}",
            params={"api_key": TMDB_API_TOKEN, **params},
            timeout=REQUEST_TIMEOUT,
        )
        if resp.status_code == 429:
            time.sleep(int(resp.headers.get("Retry-After", 2)) + attempt)
            continue
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()
    resp.raise_for_status()


def _norm(text):
    text = unicodedata.normalize("NFKD", text or "")
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in text if not unicodedata.combining(c)).lower())


def search_movie(title, year):
    """ID do TMDB de um filme do Letterboxd (titulo + ano), ou None quando
    nenhum resultado bate com o titulo e com o ano (1 ano de folga: as datas de
    estreia variam de pais para pais). Nunca devolve so "o primeiro resultado":
    um filme errado estragava as stats sem ninguem dar por isso."""
    wanted = _norm(title)
    searches = [{"primary_release_year": year}, {"year": year}, {}] if year else [{}]
    for extra in searches:
        data = _get("/search/movie", query=title, include_adult="false", language="en-US", **extra)
        for result in (data or {}).get("results", []):
            names = {_norm(result.get("title")), _norm(result.get("original_title"))}
            released = (result.get("release_date") or "")[:4]
            year_ok = year is None or (released.isdigit() and abs(int(released) - year) <= 1)
            if wanted in names and year_ok:
                return result["id"]
    return None


def fetch_movie_details(tmdb_id):
    """Detalhes de um filme de fora do clube, num pedido so:
    {year, minutes, genres, directors, cast, poster} ou None se nao existir."""
    data = _get(f"/movie/{tmdb_id}", language="en-US", append_to_response="credits")
    if not data:
        return None
    credits = data.get("credits") or {}
    cast = sorted(credits.get("cast") or [], key=lambda c: c.get("order", 999))
    released = (data.get("release_date") or "")[:4]
    return {
        "year": int(released) if released.isdigit() else None,
        "minutes": data.get("runtime") or None,
        "genres": [g["name"] for g in data.get("genres", [])],
        "directors": [c["name"] for c in credits.get("crew") or [] if c.get("job") == "Director"],
        "cast": [c["name"] for c in cast[:OUTSIDE_CAST_LIMIT]],
        "poster": data.get("poster_path"),
    }
