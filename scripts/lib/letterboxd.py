"""Scraping do Letterboxd: listas publicas, pagina de filme (para resolver TMDB id),
e pagina filme+user (rating + review), tudo via GET simples (sem Cloudflare nestes
endpoints, confirmado empiricamente)."""
import html
import json
import re

from lib.http import get

LIST_ITEM_RE = re.compile(
    r'data-item-name="(?P<name>[^"]*)"\s+data-item-slug="(?P<slug>[^"]*)"'
)
TMDB_LINK_RE = re.compile(r'themoviedb\.org/movie/(?P<id>\d+)')
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


def fetch_tmdb_id(slug):
    """Resolve o TMDB id a partir da pagina do filme no Letterboxd. None se nao encontrar."""
    resp = get(f"https://letterboxd.com/film/{slug}/")
    match = TMDB_LINK_RE.search(resp.text)
    return int(match.group("id")) if match else None


def fetch_user_review(username, slug):
    """Devolve {'rating': float|None, 'comments': [str, ...]} para (username, slug),
    ou None se o utilizador ainda nao registou o filme (404)."""
    resp = get(f"https://letterboxd.com/{username}/film/{slug}/", allow_404=True)
    if resp is None:
        return None

    match = JSON_LD_RE.search(resp.text)
    if not match:
        # Pagina existe mas sem log/rating/review deste user (raro, mas possivel).
        return {"rating": None, "comments": []}

    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError:
        return {"rating": None, "comments": []}

    rating = None
    review_rating = data.get("reviewRating")
    if review_rating and "ratingValue" in review_rating:
        rating = float(review_rating["ratingValue"])

    comments = []
    review_body = data.get("reviewBody") or data.get("description")
    if review_body:
        comments.append(review_body)

    return {"rating": rating, "comments": comments}
