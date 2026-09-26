"""Leitura do export de dados do Letterboxd (Settings > Data > Export your data).

O export e um zip com varios CSV. So interessam dois: o ratings.csv (uma linha
por filme com nota: Date, Name, Year, Letterboxd URI, Rating) e o profile.csv,
de onde sai o username para saber de quem e. Tambem se aceita o zip ja
descompactado, numa pasta.

O export traz dados pessoais (email, etc.), por isso a pasta onde se guarda
(scripts/letterboxd_exports/) nunca e versionada."""
import csv
import io
import re
import zipfile
from pathlib import Path

# letterboxd-surumkata-2026-09-26-10-00-utc.zip -> surumkata
FILENAME_USER_RE = re.compile(r"letterboxd-(?P<user>.+?)-\d{4}-\d{2}-\d{2}")
# O export tem copias de coisas apagadas; essas nao contam.
IGNORED_DIR_RE = re.compile(r"(^|/)(deleted|orphaned)/")


def iso_to_ddmmyyyy(value):
    """'2026-09-19' -> '19/09/2026' (o formato das datas do site). None se falhar."""
    match = re.match(r"^(\d{4})-(\d{2})-(\d{2})", value or "")
    if not match:
        return None
    year, month, day = match.groups()
    return f"{day}/{month}/{year}"


def _pick(names, wanted):
    """O `wanted` (ex: 'ratings.csv') do export, fora das pastas de apagados."""
    candidates = [
        n for n in names
        if n.split("/")[-1] == wanted and not IGNORED_DIR_RE.search(n)
    ]
    return min(candidates, key=len) if candidates else None


def _open(path):
    """(nomes, ler) para um zip ou uma pasta, com os nomes sempre com '/'."""
    if path.is_dir():
        files = {p.relative_to(path).as_posix(): p for p in path.rglob("*.csv")}
        return list(files), lambda name: files[name].read_text(encoding="utf-8-sig")
    archive = zipfile.ZipFile(path)
    return archive.namelist(), lambda name: archive.read(name).decode("utf-8-sig")


def read_export(path):
    """(username, [notas]) de um export. Cada nota e
    {title, year, rating, date, link}, com `link` o boxd.it do filme."""
    path = Path(path)
    names, read = _open(path)

    ratings_name = _pick(names, "ratings.csv")
    if not ratings_name:
        raise ValueError(f"{path.name}: nao tem ratings.csv (e mesmo um export do Letterboxd?)")

    username = None
    profile_name = _pick(names, "profile.csv")
    if profile_name:
        for row in csv.DictReader(io.StringIO(read(profile_name))):
            username = (row.get("Username") or "").strip() or None
            break
    if not username:
        match = FILENAME_USER_RE.search(path.name)
        username = match.group("user") if match else None
    if not username:
        raise ValueError(f"{path.name}: nao deu para saber de quem e o export (sem profile.csv)")

    rows = []
    for row in csv.DictReader(io.StringIO(read(ratings_name))):
        try:
            rating = float(row.get("Rating") or "")
        except ValueError:
            continue
        year = (row.get("Year") or "").strip()
        rows.append({
            "title": (row.get("Name") or "").strip(),
            "year": int(year) if year.isdigit() else None,
            "rating": rating,
            "date": iso_to_ddmmyyyy(row.get("Date")),
            "link": (row.get("Letterboxd URI") or "").strip() or None,
        })
    return username.lower(), rows


def find_exports(directory):
    """{username: [notas]} de todos os exports na pasta. Se houver varios do
    mesmo membro, ganha o mais recente (pela data de modificacao)."""
    directory = Path(directory)
    if not directory.exists():
        return {}
    candidates = [
        p for p in directory.iterdir()
        if p.suffix.lower() == ".zip" or (p.is_dir() and not p.name.startswith("."))
    ]
    exports = {}
    for path in sorted(candidates, key=lambda p: p.stat().st_mtime):
        try:
            username, rows = read_export(path)
        except (ValueError, zipfile.BadZipFile, KeyError) as exc:
            print(f"  AVISO: export ignorado: {exc}")
            continue
        exports[username] = rows
    return exports
