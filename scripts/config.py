import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _load_env_file():
    """Le o .env da raiz (KEY=valor por linha) para o ambiente.

    Nao sobrepoe variaveis ja definidas no ambiente, para dar para fazer
    override pontual na linha de comandos.
    """
    env_path = ROOT / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_env_file()

MAIN_LIST_URL = "https://letterboxd.com/surumkata/list/clube-de-cinema/"

CINEMA_DATA_PATH = ROOT / "src" / "cdc" / "cinemaData.json"
MEMBERS_PATH = ROOT / "scripts" / "members.json"
WEEK_META_PATH = ROOT / "scripts" / "weekMeta.json"
MANUAL_RATINGS_PATH = ROOT / "scripts" / "manualRatings.json"
FRANCHISES_PATH = ROOT / "scripts" / "franchises.json"

# Filmes de fora do clube, so para o perfil (build_letterboxd_films.py).
LETTERBOXD_FILMS_PATH = ROOT / "src" / "cdc" / "letterboxdFilms.json"
# Exports de dados do Letterboxd de cada membro. Nunca versionada: trazem o
# email e o resto do perfil.
LETTERBOXD_EXPORTS_DIR = ROOT / "scripts" / "letterboxd_exports"
# (titulo|ano) do export -> ID do TMDB, para nao repetir pesquisas.
LETTERBOXD_SEARCH_CACHE_PATH = ROOT / "scripts" / "letterboxdSearchCache.json"

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
