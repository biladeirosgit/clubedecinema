"""
Atualiza src/cdc/letterboxdFilms.json: os filmes que cada membro avaliou no
Letterboxd fora do clube. So a pagina de perfil os usa, com o toggle
"Incluir o Letterboxd" ligado.

E um script a parte de proposito: nao mexe no cinemaData.json (so o le, para
deixar de fora os filmes do clube) e o build_cinema_data.py nao mexe neste
ficheiro.

De onde vem cada coisa:
- Historico completo: o export de dados de cada membro (Letterboxd > Settings >
  Data > Export your data). O zip vai para scripts/letterboxd_exports/, sem
  mudar o nome. Basta uma vez por membro; a pasta nunca e versionada, porque o
  export traz o email e o resto do perfil.
- Filmes recentes: o RSS de cada membro, lido em todas as corridas. So traz as
  ultimas ~50 entradas do diario, mas e o unico sitio com os filmes de um membro
  que o Cloudflare do Letterboxd deixa ler.
- Detalhes (duracao, generos, realizadores, elenco, poster): API do TMDB.

O ficheiro acumula: uma nota ja guardada so muda quando o export ou o RSS
trazem uma mais recente. Correr isto de vez em quando chega para ir apanhando o
que cada um ve, mesmo sem exports novos.

    python scripts/build_letterboxd_films.py                    # todos
    python scripts/build_letterboxd_films.py --user Geremias    # so um membro
"""
import argparse
import json
import sys
from datetime import datetime

import requests

from config import (
    CINEMA_DATA_PATH,
    MEMBERS_PATH,
    LETTERBOXD_FILMS_PATH,
    LETTERBOXD_EXPORTS_DIR,
    LETTERBOXD_SEARCH_CACHE_PATH,
)
from build_cinema_data import load_json, save_json, select_members
from lib import letterboxd, tmdb
from lib.http import BlockedError
from lib.letterboxd_export import find_exports


def parse_date(value):
    try:
        return datetime.strptime(value, "%d/%m/%Y")
    except (TypeError, ValueError):
        return datetime.min  # sem data conta como a mais antiga


def dump_json(value, depth=0):
    """JSON indentado ate aos registos (um filme, uma nota), que ficam numa
    linha cada: le-se bem nos diffs sem o ficheiro ter 100 mil linhas."""
    if isinstance(value, dict) and any(isinstance(v, dict) for v in value.values()):
        pad = "    " * (depth + 1)
        items = [f"{pad}{json.dumps(k, ensure_ascii=False)}: {dump_json(v, depth + 1)}" for k, v in value.items()]
        return "{\n" + ",\n".join(items) + "\n" + "    " * depth + "}"
    return json.dumps(value, ensure_ascii=False, separators=(", ", ": "))


class FilmResolver:
    """Descobre o ID do TMDB de cada nota e guarda os detalhes de cada filme.

    Uma nota do export so traz titulo, ano e um link boxd.it. Tenta-se primeiro
    a pesquisa do TMDB (rapida, e nao gasta pedidos ao Letterboxd); so quando
    ela nao encontra o filme com o mesmo titulo e ano se segue o boxd.it ate a
    pagina do Letterboxd, que tem o ID certo. O RSS ja traz o ID."""

    def __init__(self, films, search_cache):
        self.films = films
        self.search_cache = search_cache
        self.letterboxd_blocked = False
        self.stats = {"searched": 0, "via_letterboxd": 0, "unresolved": [], "details": 0}

    def tmdb_id(self, row):
        """ID do TMDB de uma nota do export. Um filme que nao se encontrou fica
        na cache como null, para nao se voltar a pesquisar em cada corrida
        (apaga a linha da cache para tentar outra vez)."""
        key = f"{row['title']}|{row['year']}"
        if key in self.search_cache:
            found = self.search_cache[key]
        else:
            self.stats["searched"] += 1
            found = tmdb.search_movie(row["title"], row["year"])
            gave_up = False
            if found is None and row.get("link"):
                if self.letterboxd_blocked:
                    gave_up = True
                else:
                    try:
                        film = letterboxd.resolve_film(row["link"])
                    except BlockedError as exc:
                        self.letterboxd_blocked = gave_up = True
                        print(f"  AVISO: {exc}. O resto dos filmes por encontrar fica para a proxima.")
                        film = None
                    if film and film["tmdbId"]:
                        found = film["tmdbId"]
                        row["link"] = film["link"]
                        self.stats["via_letterboxd"] += 1
            if not gave_up:
                self.search_cache[key] = found
        if found is None:
            self.stats["unresolved"].append(f"{row['title']} ({row['year']})")
        return found

    def ensure_details(self, key, entry):
        """Garante os detalhes do filme `key`. False se o TMDB nao o tiver."""
        film = self.films.get(key)
        if film is None:
            details = tmdb.fetch_movie_details(int(key))
            if details is None:
                return False
            self.stats["details"] += 1
            film = self.films[key] = {
                "title": entry["title"],
                "year": entry.get("year") or details["year"],
                "minutes": details["minutes"],
                "genres": details["genres"],
                "directors": details["directors"],
                "cast": details["cast"],
                "poster": details["poster"],
                "link": None,
            }
        # O link da pagina do filme ganha ao boxd.it (que so redireciona para la).
        link = entry.get("link")
        if link and (not film.get("link") or ("boxd.it" in film["link"] and "boxd.it" not in link)):
            film["link"] = link
        return True


def update_member(name, username, current, exports, resolver, club_ids):
    """Notas de fora do clube de um membro: as que ja havia + export + RSS.
    Uma nota nova so substitui a guardada se for do mesmo dia ou mais recente."""
    mine = dict(current)
    entries = []

    rows = exports.get(username.lower())
    if rows:
        print(f"  Export de {name}: {len(rows)} notas.")
        for i, row in enumerate(rows, 1):
            tmdb_id = resolver.tmdb_id(row)
            if tmdb_id:
                entries.append((tmdb_id, row))
            if i % 200 == 0:
                print(f"    {i}/{len(rows)}...")

    try:
        rss = letterboxd.fetch_user_rss(username)
        print(f"  RSS de {name}: {len(rss)} notas recentes.")
    except BlockedError as exc:
        print(f"  AVISO: RSS de {name} falhou: {exc}")
        rss = []
    entries.extend((entry["tmdbId"], entry) for entry in rss)

    for tmdb_id, entry in entries:
        if tmdb_id in club_ids:
            continue
        key = str(tmdb_id)
        if not resolver.ensure_details(key, entry):
            continue
        saved = mine.get(key)
        if saved is None or parse_date(entry["date"]) >= parse_date(saved.get("date")):
            mine[key] = {"rating": entry["rating"], "date": entry["date"]}

    # Um filme que entretanto entrou no clube deixa de ser "de fora".
    mine = {k: v for k, v in mine.items() if int(k) not in club_ids}
    return dict(sorted(mine.items(), key=lambda kv: parse_date(kv[1].get("date")), reverse=True))


def parse_args():
    parser = argparse.ArgumentParser(
        description="Atualiza letterboxdFilms.json (filmes de fora do clube, so para o perfil).",
    )
    parser.add_argument(
        "--user",
        action="append",
        metavar="NOME",
        help="So atualiza este membro (nome do members.json, ex: --user Geremias). "
             "Pode repetir-se. Sem a flag, atualiza todos os que tem Letterboxd.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    all_members = load_json(MEMBERS_PATH, {})
    members = select_members(all_members, args.user)
    with_letterboxd = {n: m["letterboxdUsername"] for n, m in members.items() if m.get("letterboxdUsername")}
    without = sorted(set(members) - set(with_letterboxd))
    if args.user and without:
        print(f"AVISO: sem Letterboxd no members.json: {', '.join(without)}")

    cinema_data = load_json(CINEMA_DATA_PATH, {})
    club_ids = {m["tmdbId"] for m in cinema_data.values() if m.get("tmdbId")}
    data = load_json(LETTERBOXD_FILMS_PATH, {})
    films = data.get("films", {})
    ratings = data.get("ratings", {})
    search_cache = load_json(LETTERBOXD_SEARCH_CACHE_PATH, {})
    resolver = FilmResolver(films, search_cache)

    exports = find_exports(LETTERBOXD_EXPORTS_DIR)
    # Contra todos os membros, nao so os do --user: o export de outro membro
    # que ficou de fora desta corrida nao e um export desconhecido.
    known = {m["letterboxdUsername"].lower() for m in all_members.values() if m.get("letterboxdUsername")}
    for username in sorted(set(exports) - known):
        print(f"  AVISO: export de '{username}', que nao e o Letterboxd de nenhum membro.")

    counts = {}
    try:
        for name, username in with_letterboxd.items():
            before = len(ratings.get(name, {}))
            ratings[name] = update_member(name, username, ratings.get(name, {}), exports, resolver, club_ids)
            counts[name] = (before, len(ratings[name]))
    except (requests.RequestException, KeyboardInterrupt) as exc:
        # Grava o que ja se fez: a cache poupa as pesquisas na proxima corrida.
        print(f"\nInterrompido ({exc.__class__.__name__}). A gravar o que ja estava feito.", file=sys.stderr)
    finally:
        # So ficam os filmes que alguem ainda tem avaliados.
        used = {key for member in ratings.values() for key in member}
        data = {
            "_comment": (
                "Gerado pelo build_letterboxd_films.py. Filmes avaliados no Letterboxd "
                "por cada membro, sem os do clube. So aparece no perfil, com o toggle ligado."
            ),
            "films": {k: films[k] for k in sorted(used, key=int) if k in films},
            "ratings": ratings,
        }
        with open(LETTERBOXD_FILMS_PATH, "w", encoding="utf-8") as f:
            f.write(dump_json(data) + "\n")
        save_json(LETTERBOXD_SEARCH_CACHE_PATH, dict(sorted(search_cache.items())))

    stats = resolver.stats
    print("\nFilmes fora do clube (so no perfil):")
    for name, (before, after) in counts.items():
        diff = after - before
        change = f" ({'+' if diff >= 0 else ''}{diff})" if diff else ""
        print(f"  {name}: {after}{change}")
    print(f"\nPesquisas no TMDB: {stats['searched']} "
          f"(encontrados pelo Letterboxd: {stats['via_letterboxd']}). Filmes novos: {stats['details']}.")
    if stats["unresolved"]:
        print(f"\nAVISO: {len(stats['unresolved'])} nota(s) sem filme encontrado (ficam de fora):")
        for title in stats["unresolved"][:30]:
            print(f"  - {title}")


if __name__ == "__main__":
    main()
