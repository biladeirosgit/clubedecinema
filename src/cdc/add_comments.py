import json

# Carregar o arquivo cinemaData.json
with open("cinemaData.json", "r", encoding="utf-8") as f:
    cinema_data = json.load(f)

# Carregar o arquivo letterboxd_reviews.json
with open("letterboxd_reviews.json", "r", encoding="utf-8") as f:
    letterboxd_reviews = json.load(f)

# Combina as informações de reviews e comments para cada filme
for movie_name, movie_info in cinema_data.items():
    # Se o filme existir nas reviews coletadas
    if movie_name in letterboxd_reviews:
        # Adiciona o campo "comments" ao dicionário do filme
        movie_info["comments"] = letterboxd_reviews[movie_name]

# Salva o resultado no arquivo combinado
with open("combined_cinema_data.json", "w", encoding="utf-8") as f:
    json.dump(cinema_data, f, ensure_ascii=False, indent=4)

print("Os dados foram combinados e salvos em 'combined_cinema_data.json'.")
