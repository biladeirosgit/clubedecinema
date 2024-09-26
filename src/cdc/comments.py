import requests
from bs4 import BeautifulSoup
import json
import re

# Defina a lista de tuplas com usernames e nomes reais dos amigos
usernames = [("wisdow", "Wisdow"), ("surumkata", "Geremias"), ("cludos", "Cludos"), 
             ("xirao", "Xiro"), ("mestregui", "Mestre Gui"), ("squnha", "Squnha")]

# Carrega o dicionário de filmes do arquivo cinemaData.json
with open("cinemaData.json", "r", encoding="utf-8") as f:
    cinema_data = json.load(f)

# Inicializa o dicionário para armazenar as reviews usando os nomes reais dos filmes
reviews_dict = {}

# Extrai os nomes dos filmes e seus links a partir do dicionário `cinemaData`
for movie_name, movie_data in cinema_data.items():
    # Inicializa um dicionário vazio para cada filme
    reviews_dict[movie_name] = {}

    # Extrai o nome do filme da URL usando regex
    link = movie_data.get("link", "")
    match = re.search(r'/film/([\w-]+)/', link)
    if not match:
        continue

    # Nome do filme no formato usado na URL (ex: "john-wick")
    movie_url_name = match.group(1)
    
    print(f"Getting {movie_name} reviews...")

    # Para cada usuário, vamos fazer o scraping do site e coletar as reviews
    for username, friend_name in usernames:
        # Constrói a URL usando o nome do filme e o username
        url = f"https://letterboxd.com/{username}/film/{movie_url_name}/"
        
        # Faz a requisição à URL
        response = requests.get(url)
        
        if response.status_code == 200:
            # Analisa o conteúdo da página
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Encontra a seção de review do usuário
            review_section = soup.find("div", class_="review body-text -prose -hero -loose")
            
            if review_section:
                # Extrai as linhas do comentário (tags <p>)
                review_lines = [p.get_text() for p in review_section.find_all("p")]
                
                # Adiciona a review ao dicionário usando o nome real do amigo
                reviews_dict[movie_name][friend_name] = review_lines

# Salva o resultado em um arquivo JSON com o nome original dos filmes e dos amigos
with open("letterboxd_reviews.json", "w", encoding="utf-8") as json_file:
    json.dump(reviews_dict, json_file, ensure_ascii=False, indent=4)

print("As reviews foram extraídas e salvas em 'letterboxd_reviews.json'.")
