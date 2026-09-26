"""Scraping do Letterboxd: listas publicas, pagina de filme (TMDB id, realizadores,
elenco e temas) e pagina filme+user (rating + review), tudo via GET simples (sem
Cloudflare nestes endpoints, confirmado empiricamente)."""
import html
import json
import re
import xml.etree.ElementTree as ET

from lib.http import get
from lib.letterboxd_export import iso_to_ddmmyyyy

LIST_ITEM_RE = re.compile(
    r'data-item-name="(?P<name>[^"]*)"\s+data-item-slug="(?P<slug>[^"]*)"'
)
TMDB_LINK_RE = re.compile(r'themoviedb\.org/movie/(?P<id>\d+)')
FILM_LINK_RE = re.compile(r'letterboxd\.com/(?:[^/]+/)?film/(?P<slug>[^/]+)/')
RSS_NS = {"letterboxd": "https://letterboxd.com", "tmdb": "https://themoviedb.org"}
THEME_LINK_RE = re.compile(r'/films/theme/(?P<slug>[a-z0-9-]+)/')
JSON_LD_RE = re.compile(
    r'<script type="application/ld\+json">\s*(?:/\*.*?\*/)?\s*(\{.*?\})\s*(?:/\*.*?\*/)?\s*</script>',
    re.DOTALL,
)


def _parse_title_year(item_name):
    """'Lost in Translation (2003)' -> ('Lost in Translation', 2003)"""
    item_name = html.unescape(item_name)
    match = re.match(r'^(.*)\s\((\d{4})\)$', item_name)
    if not match:
        return item_name, None
    return match.group(1), int(match.group(2))


def fetch_list(list_url):
    """Devolve [{slug, title, year}, ...] percorrendo todas as paginas da lista."""
    items = []
    seen_slugs = set()
    page = 1
    while True:
        url = list_url if page == 1 else f"{list_url.rstrip('/')}/page/{page}/"
        resp = get(url)
        matches = LIST_ITEM_RE.findall(resp.text)
        if not matches:
            break
        for item_name, slug in matches:
            if slug in seen_slugs:
                continue
            seen_slugs.add(slug)
            title, year = _parse_title_year(item_name)
            items.append({"slug": slug, "title": title, "year": year})
        page += 1
    return items


def _people(entries):
    """[{'@type': 'Person', 'name': 'Sam Mendes', ...}, ...] -> ['Sam Mendes', ...]"""
    if not entries:
        return []
    return [p["name"] for p in entries if isinstance(p, dict) and p.get("name")]


def _theme_name(slug):
    """'crime-drugs-and-gangsters' -> 'Crime drugs and gangsters'. O Letterboxd so
    expoe o tema como slug no HTML, portanto perde-se a pontuacao do nome original."""
    words = slug.replace("-", " ")
    return words[:1].upper() + words[1:]


def fetch_film(slug):
    """Um GET a pagina do filme, de onde sai tudo o que ela tem de util:
    {'tmdbId': int|None, 'directors': [...], 'cast': [...], 'themes': [...]}.

    O realizador e o elenco vem do bloco JSON-LD (chaves 'director' e 'actor' —
    'actor' e mesmo no singular, 'actors' vem a null). Os temas nao estao no
    JSON-LD, so nos links /films/theme/ do HTML."""
    resp = get(f"https://letterboxd.com/film/{slug}/")

    tmdb_match = TMDB_LINK_RE.search(resp.text)
    tmdb_id = int(tmdb_match.group("id")) if tmdb_match else None

    directors, cast = [], []
    ld_match = JSON_LD_RE.search(resp.text)
    if ld_match:
        try:
            data = json.loads(ld_match.group(1))
        except json.JSONDecodeError:
            data = {}
        directors = _people(data.get("director"))
        cast = _people(data.get("actor"))

    themes = sorted({_theme_name(m) for m in THEME_LINK_RE.findall(resp.text)})

    return {"tmdbId": tmdb_id, "directors": directors, "cast": cast, "themes": themes}


def fetch_user_review(username, slug):
    """Devolve {'rating': float|None, 'comment': str|None} para (username, slug),
    ou None se o utilizador ainda nao registou o filme (404).

    No Letterboxd cada pessoa tem uma review por filme, nao varias -- dai o
    comentario ser uma string e nao uma lista: as quebras de linha vao dentro
    do proprio texto, nao em elementos separados."""
    resp = get(f"https://letterboxd.com/{username}/film/{slug}/", allow_404=True)
    if resp is None:
        return None

    match = JSON_LD_RE.search(resp.text)
    if not match:
        # Pagina existe mas sem log/rating/review deste user (raro, mas possivel).
        return {"rating": None, "comment": None}

    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError:
        return {"rating": None, "comment": None}

    rating = None
    review_rating = data.get("reviewRating")
    if review_rating and "ratingValue" in review_rating:
        rating = float(review_rating["ratingValue"])

    review_body = data.get("reviewBody") or data.get("description")

    return {"rating": rating, "comment": review_body or None}


def fetch_user_rss(username):
    """As entradas mais recentes do diario de um membro, so as que tem nota:
    [{tmdbId, title, year, rating, date, link}], da mais recente para a mais
    antiga. O feed so traz as ultimas ~50, mas e o unico sitio com os filmes de
    um membro que nao esta atras do Cloudflare (as paginas /films/ a partir da
    segunda, o diario e o perfil dao 403). Um feed que nao existe da []."""
    resp = get(f"https://letterboxd.com/{username}/rss/", allow_404=True)
    if resp is None:
        return []
    entries = []
    for item in ET.fromstring(resp.content).iter("item"):
        rating = item.findtext("letterboxd:memberRating", namespaces=RSS_NS)
        tmdb_id = item.findtext("tmdb:movieId", namespaces=RSS_NS)
        if not rating or not tmdb_id:
            continue  # uma lista, ou um filme registado sem nota
        year = item.findtext("letterboxd:filmYear", namespaces=RSS_NS)
        link = FILM_LINK_RE.search(item.findtext("link") or "")
        entries.append({
            "tmdbId": int(tmdb_id),
            "title": html.unescape(item.findtext("letterboxd:filmTitle", namespaces=RSS_NS) or ""),
            "year": int(year) if year and year.isdigit() else None,
            "rating": float(rating),
            "date": iso_to_ddmmyyyy(item.findtext("letterboxd:watchedDate", namespaces=RSS_NS)),
            "link": f"https://letterboxd.com/film/{link.group('slug')}/" if link else None,
        })
    return entries


def resolve_film(url):
    """Segue um link do Letterboxd (ex: o boxd.it do export) ate a pagina do
    filme: {'link': URL da pagina, 'tmdbId': int|None}, ou None se nao existir.
    Um pedido so. E o plano B quando a pesquisa do TMDB nao encontra o filme."""
    resp = get(url, allow_404=True)
    if resp is None:
        return None
    tmdb_match = TMDB_LINK_RE.search(resp.text)
    return {"link": resp.url, "tmdbId": int(tmdb_match.group("id")) if tmdb_match else None}
