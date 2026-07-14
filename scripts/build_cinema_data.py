"""
Pipeline principal: atualiza cinemaData.json e wheelData.json a partir das duas
listas publicas do Letterboxd + TMDB, preenchendo so o que falta.

cinemaData.json e tratado como estado vivo: nunca sobrescreve um rating/comentario
ja presente (seja de scraping anterior ou escrito a mao), so preenche o que falta.
Membros sem conta Letterboxd (letterboxdUsername=None em members.json) nunca sao
scraped - as suas avaliacoes sao sempre manuais.

Corre-se via `python scripts/build_cinema_data.py`, tipicamente a partir do
workflow do GitHub Actions (workflow_dispatch manual).
"""
import json
import sys

from config import (
    MAIN_LIST_URL,
    WHEEL_LIST_URL,
    CINEMA_DATA_PATH,
    WHEEL_DATA_PATH,
    MEMBERS_PATH,
    WEEK_META_PATH,
    WHEEL_SELECTIONS_PATH,
    MANUAL_RATINGS_PATH,
)
from lib import letterboxd, tmdb, images
from lib.http import BlockedError


def load_json(path, default):
    if not path.exists():
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def film_link(slug):
    return f"https://letterboxd.com/film/{slug}/"


def update_movie_media(slug, movie, stats):
    """Preenche genres/minutes/poster/backdrop via TMDB, so se faltar algo."""
    needs_metadata = not movie.get("genres") or movie.get("minutes") is None
    poster_missing = not (images.POSTERS_DIR / f"{slug}.png").exists()
    backdrop_missing = not (images.BACKGROUNDS_DIR / f"{slug}.png").exists()

    if not (needs_metadata or poster_missing or backdrop_missing):
        return

    tmdb_id = movie.get("tmdbId")
    if tmdb_id is None:
        tmdb_id = letterboxd.fetch_tmdb_id(slug)
        if tmdb_id is None:
            print(f"  AVISO: sem match TMDB para '{slug}' — genres/minutes/imagens nao preenchidos")
            return
        movie["tmdbId"] = tmdb_id

    tmdb_data = tmdb.fetch_movie(tmdb_id)
    if tmdb_data is None:
        print(f"  AVISO: TMDB id {tmdb_id} nao encontrado para '{slug}'")
        return

    if needs_metadata:
        movie["genres"] = tmdb_data["genres"] or movie.get("genres", [])
        movie["minutes"] = tmdb_data["minutes"] if tmdb_data["minutes"] is not None else movie.get("minutes")

    if poster_missing and images.ensure_poster(slug, tmdb_data["poster_path"]):
        stats["posters_downloaded"] += 1
    if backdrop_missing and images.ensure_backdrop(slug, tmdb_data["backdrop_path"]):
        stats["backdrops_downloaded"] += 1


def update_movie_reviews(slug, movie, members, stats):
    """Scrape idempotente: so tenta (member, filme) se ainda nao ha reviews/comments
    para esse membro, e so para membros com letterboxdUsername definido."""
    reviews = movie.setdefault("reviews", {})
    comments = movie.setdefault("comments", {})

    for display_name, member in members.items():
        username = member.get("letterboxdUsername")
        if not username:
            continue  # sem Letterboxd: rating so entra a mao
        if display_name in reviews or display_name in comments:
            continue  # ja temos dado (manual ou de scraping anterior) — nao mexer

        result = letterboxd.fetch_user_review(username, slug)
        if result is None:
            continue  # ainda nao viu/avaliou — tenta de novo no proximo run

        if result["rating"] is not None:
            reviews[display_name] = result["rating"]
            stats["reviews_added"] += 1
        if result["comments"]:
            comments[display_name] = result["comments"]
            stats["comments_added"] += 1


def apply_manual_ratings(cinema_data, stats):
    """Aplica as notas manuais de manualRatings.json (membros sem Letterboxd, ou
    lacunas de scraping). So preenche o que falta — nunca sobrescreve. O ficheiro
    e organizado por membro: {"Atlas": {"the-notebook": {"rating": 4}, ...}}."""
    manual = load_json(MANUAL_RATINGS_PATH, {})
    for member, movies in manual.items():
        if member.startswith("_"):
            continue
        for slug, entry in movies.items():
            if slug.startswith("_"):
                continue
            rating = entry.get("rating") if isinstance(entry, dict) else entry
            if not isinstance(rating, (int, float)):
                continue  # null / vazio = ainda nao viu
            movie = cinema_data.get(slug)
            if movie is None:
                continue
            reviews = movie.setdefault("reviews", {})
            if member in reviews:
                continue  # ja tem nota — nao mexer
            reviews[member] = rating
            stats["reviews_added"] += 1


def build_main_cinema_data(members, week_meta, stats):
    cinema_data = load_json(CINEMA_DATA_PATH, {})
    list_items = letterboxd.fetch_list(MAIN_LIST_URL)
    print(f"Lista principal: {len(list_items)} filmes encontrados no Letterboxd.")

    pending_week_meta = []

    for item in list_items:
        slug = item["slug"]

        if slug not in week_meta:
            pending_week_meta.append(slug)
            continue

        is_new = slug not in cinema_data
        movie = cinema_data.setdefault(slug, {
            "title": item["title"],
            "year": item["year"],
            "link": film_link(slug),
            "reviews": {},
            "comments": {},
        })
        if is_new:
            stats["movies_added"] += 1

        meta = week_meta[slug]
        movie["date"] = meta.get("date")
        movie["chosenBy"] = meta.get("chosenBy", [])

        update_movie_media(slug, movie, stats)
        update_movie_reviews(slug, movie, members, stats)

    apply_manual_ratings(cinema_data, stats)

    save_json(CINEMA_DATA_PATH, cinema_data)

    if pending_week_meta:
        print(f"\nAVISOS: {len(pending_week_meta)} filme(s) sem entrada em weekMeta.json — omitidos do site:")
        for slug in pending_week_meta:
            print(f"  - {slug}  (adiciona chosenBy/date em scripts/weekMeta.json e corre de novo)")


def build_wheel_data(stats):
    wheel_items = letterboxd.fetch_list(WHEEL_LIST_URL)
    print(f"Lista da roda: {len(wheel_items)} filmes encontrados no Letterboxd.")

    existing = {m["slug"]: m for m in load_json(WHEEL_DATA_PATH, [])}
    # quem escolheu cada filme da roda e input manual (bloqueado no Letterboxd)
    wheel_selections = load_json(WHEEL_SELECTIONS_PATH, {})
    wheel_data = []

    for item in wheel_items:
        slug = item["slug"]
        movie = existing.get(slug, {"slug": slug, "title": item["title"], "year": item["year"]})
        update_movie_media(slug, movie, stats)
        # injeta chosenBy do ficheiro manual (sobrepoe), senao mantem o existente
        if slug in wheel_selections and wheel_selections[slug].get("chosenBy"):
            movie["chosenBy"] = wheel_selections[slug]["chosenBy"]
        wheel_data.append(movie)

    save_json(WHEEL_DATA_PATH, wheel_data)


def main():
    members = load_json(MEMBERS_PATH, {})
    week_meta = load_json(WEEK_META_PATH, {})

    stats = {
        "movies_added": 0,
        "reviews_added": 0,
        "comments_added": 0,
        "posters_downloaded": 0,
        "backdrops_downloaded": 0,
    }

    try:
        build_main_cinema_data(members, week_meta, stats)
        build_wheel_data(stats)
    except BlockedError as exc:
        print(f"\nERRO FATAL: {exc}", file=sys.stderr)
        print("O Letterboxd bloqueou um pedido a um endpoint que devia estar acessivel.", file=sys.stderr)
        print("Nao foi feito nenhum commit de dados parciais.", file=sys.stderr)
        sys.exit(1)

    print("\nResumo:")
    print(f"  Filmes novos: {stats['movies_added']}")
    print(f"  Reviews novas: {stats['reviews_added']}")
    print(f"  Comentarios novos: {stats['comments_added']}")
    print(f"  Posters descarregados: {stats['posters_downloaded']}")
    print(f"  Backdrops descarregados: {stats['backdrops_downloaded']}")


if __name__ == "__main__":
    main()
