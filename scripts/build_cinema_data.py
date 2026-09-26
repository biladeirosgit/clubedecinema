"""
Pipeline principal: atualiza cinemaData.json a partir da lista publica do
Letterboxd + TMDB, preenchendo so o que falta.

cinemaData.json e tratado como estado vivo: nunca sobrescreve um rating/comentario
ja presente (seja de scraping anterior ou escrito a mao), so preenche o que falta.
Membros sem conta Letterboxd (letterboxdUsername=None em members.json) nunca sao
scraped - as suas avaliacoes sao sempre manuais.

Corre-se via `python scripts/build_cinema_data.py`, tipicamente a partir do
workflow do GitHub Actions (workflow_dispatch manual). `--last N` limita o
scraping aos N filmes mais recentes e `--user NOME` a um membro so; as duas
flags combinam-se.
"""
import argparse
import json
import sys
from datetime import datetime

from config import (
    MAIN_LIST_URL,
    CINEMA_DATA_PATH,
    MEMBERS_PATH,
    WEEK_META_PATH,
    MANUAL_RATINGS_PATH,
    FRANCHISES_PATH,
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


def parse_week_date(value):
    """Converte 'DD/MM/YYYY' num datetime. Devolve None se faltar/for invalido."""
    if not value:
        return None
    try:
        return datetime.strptime(value, "%d/%m/%Y")
    except ValueError:
        return None


def week_has_started(value, today=None):
    """True se a semana do filme ja comecou (ou se a data falta/e invalida, para
    manter o comportamento de sempre). Como o clube escolhe os filmes de um mes
    todos de uma vez, o weekMeta tem filmes com data no futuro: esses ainda nao
    foram vistos por ninguem, portanto nao se lhes vai buscar ratings."""
    parsed = parse_week_date(value)
    if parsed is None:
        return True
    return parsed.date() <= (today or datetime.now().date())


def recent_slugs(week_meta, limit):
    """Devolve o conjunto dos `limit` slugs mais recentes segundo a data em
    weekMeta.json. Filmes com data em falta/invalida ficam no fim da ordenacao,
    para nunca roubarem o lugar a um filme com data valida. Filmes ainda por
    chegar ficam de fora — senao um `--last 5` gastava-se todo em filmes futuros
    e nem chegava ao filme desta semana."""
    if limit is None:
        return None  # sem limite: todos os filmes sao elegiveis

    dated = []
    undated = []
    for slug, meta in week_meta.items():
        date_value = meta.get("date")
        if not week_has_started(date_value):
            continue
        parsed = parse_week_date(date_value)
        if parsed is None:
            undated.append(slug)
        else:
            dated.append((parsed, slug))

    dated.sort(key=lambda pair: pair[0], reverse=True)
    ordered = [slug for _, slug in dated] + undated
    return set(ordered[:limit])


def update_movie_details(slug, movie, stats):
    """Preenche realizadores/elenco/temas (pagina do Letterboxd) e
    genres/minutes/poster/backdrop/saga (TMDB), so o que faltar.

    A pagina do filme no Letterboxd e descarregada no maximo uma vez por filme:
    serve tanto para os creditos como para resolver o TMDB id."""
    needs_metadata = not movie.get("genres") or movie.get("minutes") is None
    poster_missing = not (images.POSTERS_DIR / f"{slug}.png").exists()
    backdrop_missing = not (images.BACKGROUNDS_DIR / f"{slug}.png").exists()
    # A chave presente (mesmo a null) e que marca "ja verificado" — a maioria dos
    # filmes nao pertence a saga nenhuma e nao pode ser pedida em todos os runs.
    needs_franchise = "franchise" not in movie
    needs_tmdb = needs_metadata or poster_missing or backdrop_missing or needs_franchise
    needs_credits = not movie.get("directors")

    tmdb_id = movie.get("tmdbId")
    if needs_credits or (needs_tmdb and tmdb_id is None):
        film = letterboxd.fetch_film(slug)
        if needs_credits:
            if film["directors"]:
                movie["directors"] = film["directors"]
                movie["cast"] = film["cast"]
                movie["themes"] = film["themes"]
                stats["credits_added"] += 1
            else:
                # Sem realizador nao gravamos nada, para tentar de novo no proximo run.
                print(f"  AVISO: sem realizador para '{slug}' — creditos nao preenchidos")
        if tmdb_id is None and film["tmdbId"] is not None:
            tmdb_id = film["tmdbId"]
            movie["tmdbId"] = tmdb_id

    if not needs_tmdb:
        return

    if tmdb_id is None:
        print(f"  AVISO: sem match TMDB para '{slug}' — genres/minutes/imagens nao preenchidos")
        return

    tmdb_data = tmdb.fetch_movie(tmdb_id)
    if tmdb_data is None:
        print(f"  AVISO: TMDB id {tmdb_id} nao encontrado para '{slug}'")
        return

    if needs_metadata:
        movie["genres"] = tmdb_data["genres"] or movie.get("genres", [])
        movie["minutes"] = tmdb_data["minutes"] if tmdb_data["minutes"] is not None else movie.get("minutes")

    if needs_franchise:
        movie["franchise"] = tmdb_data["collection"]
        if tmdb_data["collection"]:
            stats["franchises_found"] += 1

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
        if result["comment"]:
            comments[display_name] = result["comment"]
            stats["comments_added"] += 1


def apply_manual_ratings(cinema_data, stats, only_members=None):
    """Aplica as notas manuais de manualRatings.json (membros sem Letterboxd, ou
    lacunas de scraping). So preenche o que falta — nunca sobrescreve. O ficheiro
    e organizado por membro: {"Atlas": {"the-notebook": {"rating": 4}, ...}}.
    Com `only_members` (--user) so os membros desse conjunto sao aplicados."""
    manual = load_json(MANUAL_RATINGS_PATH, {})
    for member, movies in manual.items():
        if member.startswith("_"):
            continue
        if only_members is not None and member not in only_members:
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


def apply_franchise_overrides(cinema_data, stats):
    """Aplica o franchises.json por cima do que veio do TMDB. O ficheiro e
    {"Nome da saga": ["slug-1", "slug-2", ...]}, com a lista ja pela ordem certa
    da historia. Serve para tres coisas: renomear uma saga do TMDB, forcar uma
    ordem diferente da data de estreia, e criar sagas que o TMDB nao modela."""
    overrides = load_json(FRANCHISES_PATH, {})
    for name, slugs in overrides.items():
        if name.startswith("_"):
            continue
        for order, slug in enumerate(slugs):
            movie = cinema_data.get(slug)
            if movie is None:
                print(f"  AVISO: franchises.json tem '{slug}' (saga '{name}') mas esse filme nao existe")
                continue
            if movie.get("franchise") != name or movie.get("franchiseOrder") != order:
                stats["franchises_overridden"] += 1
            movie["franchise"] = name
            movie["franchiseOrder"] = order


def build_main_cinema_data(members, week_meta, stats, review_limit=None, only_members=None):
    cinema_data = load_json(CINEMA_DATA_PATH, {})
    list_items = letterboxd.fetch_list(MAIN_LIST_URL)
    print(f"Lista principal: {len(list_items)} filmes encontrados no Letterboxd.")

    scrape_slugs = recent_slugs(week_meta, review_limit)
    if scrape_slugs is not None:
        print(f"Ratings: so os {len(scrape_slugs)} filmes mais recentes (--last {review_limit}).")

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

        # Poster/backdrop/generos/creditos sao tratados na mesma: o site precisa
        # deles para anunciar os filmes que estao a caminho.
        update_movie_details(slug, movie, stats)

        if not week_has_started(movie["date"]):
            stats["movies_upcoming"] += 1
        elif scrape_slugs is None or slug in scrape_slugs:
            update_movie_reviews(slug, movie, members, stats)

    apply_manual_ratings(cinema_data, stats, only_members)
    apply_franchise_overrides(cinema_data, stats)

    save_json(CINEMA_DATA_PATH, cinema_data)

    if pending_week_meta:
        print(f"\nAVISOS: {len(pending_week_meta)} filme(s) sem entrada em weekMeta.json — omitidos do site:")
        for slug in pending_week_meta:
            print(f"  - {slug}  (adiciona chosenBy/date em scripts/weekMeta.json e corre de novo)")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Atualiza cinemaData.json (Letterboxd + TMDB).",
    )
    parser.add_argument(
        "--last",
        type=int,
        default=None,
        metavar="N",
        help="So vai buscar ratings/comentarios ao Letterboxd dos N filmes mais "
             "recentes (por data em weekMeta.json). Sem a flag, tenta todos. "
             "Imagens e metadados em falta continuam a ser tratados para todos.",
    )
    parser.add_argument(
        "--user",
        action="append",
        metavar="NOME",
        help="So atualiza este membro (nome de exibicao do members.json, ex: "
             "--user Geremias). Pode repetir-se para varios. Combina com --last. "
             "Sem a flag, atualiza todos os membros.",
    )
    args = parser.parse_args()
    if args.last is not None and args.last < 1:
        parser.error("--last tem de ser >= 1")
    return args


def select_members(members, names):
    """Restringe os membros aos nomes pedidos com --user. Os nomes tem de ser os
    de exibicao do members.json (ex: "Mestre Gui"), com espacos e maiusculas
    iguais — sao a chave usada em todo o lado, incluindo no cinemaData.json."""
    if not names:
        return members
    unknown = [name for name in names if name not in members]
    if unknown:
        print(f"ERRO: membro(s) desconhecido(s): {', '.join(unknown)}", file=sys.stderr)
        print(f"Nomes validos: {', '.join(sorted(members))}", file=sys.stderr)
        sys.exit(2)
    return {name: members[name] for name in names}


def main():
    args = parse_args()
    members = load_json(MEMBERS_PATH, {})
    week_meta = load_json(WEEK_META_PATH, {})

    selected_members = select_members(members, args.user)
    only_members = set(selected_members) if args.user else None
    if only_members:
        print(f"Ratings: so o(s) membro(s) {', '.join(args.user)} (--user).")

    stats = {
        "movies_added": 0,
        "movies_upcoming": 0,
        "credits_added": 0,
        "franchises_found": 0,
        "franchises_overridden": 0,
        "reviews_added": 0,
        "comments_added": 0,
        "posters_downloaded": 0,
        "backdrops_downloaded": 0,
    }

    try:
        build_main_cinema_data(
            selected_members,
            week_meta,
            stats,
            review_limit=args.last,
            only_members=only_members,
        )
    except BlockedError as exc:
        print(f"\nERRO FATAL: {exc}", file=sys.stderr)
        print("O Letterboxd bloqueou um pedido a um endpoint que devia estar acessivel.", file=sys.stderr)
        print("Nao foi feito nenhum commit de dados parciais.", file=sys.stderr)
        sys.exit(1)

    print("\nResumo:")
    print(f"  Filmes novos: {stats['movies_added']}")
    print(f"  Filmes por chegar (sem scraping de ratings): {stats['movies_upcoming']}")
    print(f"  Filmes com creditos novos (realizador/elenco/temas): {stats['credits_added']}")
    print(f"  Filmes com saga encontrada no TMDB: {stats['franchises_found']}")
    print(f"  Filmes com saga corrigida a mao: {stats['franchises_overridden']}")
    print(f"  Reviews novas: {stats['reviews_added']}")
    print(f"  Comentarios novos: {stats['comments_added']}")
    print(f"  Posters descarregados: {stats['posters_downloaded']}")
    print(f"  Backdrops descarregados: {stats['backdrops_downloaded']}")


if __name__ == "__main__":
    main()
