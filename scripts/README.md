# Pipeline de dados do Clube de Cinema

Atualiza `src/cdc/cinemaData.json` e `src/cdc/wheelData.json` a partir das listas
publicas do Letterboxd e da API do TMDB.

## Como usar

1. Sempre que houver filme novo no clube, adiciona-o a
   `https://letterboxd.com/surumkata/list/clube-de-cinema/` como já fazes.
2. Edita `scripts/weekMeta.json` e adiciona uma entrada para o filme (slug do
   Letterboxd, quem escolheu, data de início da semana):
   ```json
   "nome-do-filme": { "chosenBy": ["Alguem"], "date": "13/07/2026" }
   ```
   Sem isto o filme não aparece no site (fica de fora com um aviso no log).
3. Corre o workflow "Update cinema data" no separador Actions do GitHub
   (botão "Run workflow"), ou localmente:
   ```
   pip install -r scripts/requirements.txt
   TMDB_API_TOKEN=o_teu_token python scripts/build_cinema_data.py
   ```
4. O script só preenche o que falta: ratings/comentários novos (por membro
   e filme), posters/backdrops em falta, e géneros/duração via TMDB para
   filmes novos. **Nunca sobrescreve um rating/comentário já existente** —
   podes sempre editar `src/cdc/cinemaData.json` à mão (ex: para membros
   sem Letterboxd, ou se o scraping falhar para alguém) que a tua edição
   fica.
5. O workflow só faz commit dos dados/imagens — o deploy do site continua
   manual (`npm run deploy`).

## Notas manuais (membros sem Letterboxd)

Os membros sem conta no Letterboxd (`letterboxdUsername: null` em `members.json`)
nunca são lidos do site — as notas deles entram à mão via `scripts/manualRatings.json`.

1. Gera/atualiza o template:
   ```
   python scripts/build_manual_template.py
   ```
   Isto (re)cria `scripts/manualRatings.json` com, para cada membro, os filmes
   que ainda **não** têm nota (com o título para referência).
2. Abre `scripts/manualRatings.json` e escreve a nota (0.5 a 5) nos filmes que
   cada pessoa viu. Deixa `null` nos que não viu. Exemplo:
   ```json
   "Atlas": {
       "lost-in-translation": { "rating": 4.5, "title": "Lost in Translation (2003)" },
       "drive-2011": { "rating": null, "title": "Drive (2011)" }
   }
   ```
3. Corre `python scripts/build_cinema_data.py` (ou o workflow). As notas são
   fundidas no `cinemaData.json`. **Nunca sobrescreve** o que já lá está, e os
   `null` são ignorados.
4. Podes voltar a correr o `build_manual_template.py` quando quiseres — preserva
   o que já preencheste e só acrescenta os filmes novos que faltem.

(Este ficheiro também serve para forçar uma nota a um membro *com* Letterboxd,
caso o scraping falhe para alguém: basta acrescentar uma chave com o nome dele.)

## Ficheiros

- `members.json` — mapeamento nome de exibição → username Letterboxd (ou
  `null` se não tiver conta) → ficheiro de pfp.
- `weekMeta.json` — quem escolheu + data de cada filme (input manual).
- `wheelSelections.json` — quem escolheu cada filme da roda (input manual).
- `manualRatings.json` — notas dos membros sem Letterboxd (input manual).
- `build_manual_template.py` — gera/atualiza o `manualRatings.json`.
- `build_cinema_data.py` — script principal (scraping + TMDB + merges).
- `migrate_to_slugs.py` — script one-time já corrido (histórico, não
  precisas de correr outra vez).
