"""
Migracao one-time: converte cinemaData.json de chave=titulo para chave=slug,
extrai chosen-by/date para weekMeta.json, e renomeia as imagens de poster/backdrop
de {cleanTitle(title)}.png para {slug}.png.

Corre-se uma unica vez, localmente (nao faz parte do workflow do GitHub Actions).
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CINEMA_DATA_PATH = ROOT / "src" / "cdc" / "cinemaData.json"
WEEK_META_PATH = ROOT / "scripts" / "weekMeta.json"
POSTERS_DIR = ROOT / "public" / "posters"
BACKGROUNDS_DIR = ROOT / "public" / "backgrounds"


def clean_title(title):
    """Replica exata de cleanTitle() em Movie.js/MovieCard.js/etc: str.replace(/[^\\w\\s]/gi, '')"""
    return re.sub(r"[^a-zA-Z0-9_\s]", "", title)


def extract_slug(link):
    if not link or "/film/" not in link:
        return None
    rest = link.split("/film/", 1)[1]
    rest = rest.split("/")[0].split("?")[0].split("#")[0]
    return rest or None


def main():
    with open(CINEMA_DATA_PATH, encoding="utf-8") as f:
        old_data = json.load(f)

    new_cinema_data = {}
    week_meta = {}
    slug_to_title = {}
    warnings = []

    for title, movie in old_data.items():
        slug = extract_slug(movie.get("link", ""))
        if not slug:
            warnings.append(f"SEM SLUG (link malformado): '{title}' -> {movie.get('link')!r}")
            continue

        if slug in slug_to_title:
            warnings.append(
                f"COLISAO DE SLUG '{slug}': '{title}' e '{slug_to_title[slug]}' "
                "mapeiam para o mesmo slug — resolve manualmente antes de continuar."
            )
            continue
        slug_to_title[slug] = title

        chosen_by = movie.get("chosen by", [])
        date = movie.get("date")

        # cinemaData.json e o output final consumido pelo React (import estatico):
        # inclui chosenBy/date mesmo sendo campos "de origem manual", para nao
        # obrigar o app a fazer merge em runtime com o weekMeta.json.
        new_cinema_data[slug] = {
            "title": title,
            "year": movie.get("year"),
            "link": movie.get("link"),
            "date": date,
            "chosenBy": chosen_by,
            "genres": movie.get("genres", []),
            "minutes": movie.get("minutes"),
            "reviews": movie.get("reviews", {}),
            "comments": movie.get("comments", {}),
        }

        # weekMeta.json e a copia editavel a mao / input do pipeline Python
        # (build_cinema_data.py le isto e injeta chosenBy/date em filmes novos).
        week_meta[slug] = {
            "chosenBy": chosen_by,
            "date": date,
        }

    # Renomear imagens: {cleanTitle(title)}.png -> {slug}.png
    # Nota: usa comparacao de nomes via listdir (case-sensitive) em vez de
    # Path.exists() (case-insensitive no Windows), e um rename em dois passos
    # (via nome temporario), para nao falhar silenciosamente quando o nome
    # antigo e o novo diferem so na capitalizacao (ex: "Her.png" -> "her.png").
    def rename_images(directory):
        renamed, missing = 0, []
        actual_files = {p.name for p in directory.iterdir() if p.suffix == ".png"}
        for title, movie in old_data.items():
            slug = extract_slug(movie.get("link", ""))
            if not slug:
                continue
            old_name = f"{clean_title(title)}.png"
            new_name = f"{slug}.png"
            if new_name in actual_files:
                continue  # ja migrado com a capitalizacao correta
            if old_name not in actual_files:
                missing.append(old_name)
                continue
            old_path = directory / old_name
            tmp_path = directory / f"__tmp__{new_name}"
            old_path.rename(tmp_path)
            tmp_path.rename(directory / new_name)
            actual_files.discard(old_name)
            actual_files.add(new_name)
            renamed += 1
        return renamed, missing

    posters_renamed, posters_missing = rename_images(POSTERS_DIR)
    backgrounds_renamed, backgrounds_missing = rename_images(BACKGROUNDS_DIR)

    with open(CINEMA_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(new_cinema_data, f, ensure_ascii=False, indent=4)

    with open(WEEK_META_PATH, "w", encoding="utf-8") as f:
        json.dump(week_meta, f, ensure_ascii=False, indent=4)

    print(f"Migrados {len(new_cinema_data)} filmes de {len(old_data)} originais.")
    print(f"Posters renomeados: {posters_renamed} (em falta: {len(posters_missing)})")
    print(f"Backgrounds renomeados: {backgrounds_renamed} (em falta: {len(backgrounds_missing)})")
    if posters_missing:
        print("Posters em falta:", posters_missing)
    if backgrounds_missing:
        print("Backgrounds em falta:", backgrounds_missing)
    if warnings:
        print("\nAVISOS:")
        for w in warnings:
            print(" -", w)


if __name__ == "__main__":
    main()
