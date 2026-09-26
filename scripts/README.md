# Pipeline de dados do Clube de Cinema

Atualiza `src/cdc/cinemaData.json` a partir da lista publica do Letterboxd e da
API do TMDB.

O resumo de todos os comandos está no [README da raiz](../README.md#guia-de-comandos).
Aqui fica o detalhe do pipeline.

## Como usar

1. Sempre que houver filme novo no clube, adiciona-o a
   `https://letterboxd.com/surumkata/list/clube-de-cinema/` como já fazes.
2. Edita `scripts/weekMeta.json` e adiciona uma entrada para o filme (slug do
   Letterboxd, quem escolheu, data de início da semana):
   ```json
   "nome-do-filme": { "chosenBy": ["Alguem"], "date": "13/07/2026" }
   ```
   Sem isto o filme não aparece no site (fica de fora com um aviso no log).

   Como o clube escolhe os filmes do mês todos de uma vez, podes (e deves) pôr
   já as entradas das semanas que ainda não chegaram — ver a secção seguinte.
3. Corre o workflow "Update cinema data" no separador Actions do GitHub
   (botão "Run workflow"), ou localmente:
   ```
   pip install -r scripts/requirements.txt
   python scripts/build_cinema_data.py
   ```
   O token do TMDB é lido do ficheiro `.env` na raiz do projeto (ver secção
   abaixo) — só o tens de configurar uma vez.

   Para uma corrida rápida (só o filme desta semana e os anteriores recentes),
   usa `--last N`, que limita o scraping de ratings/comentários aos N filmes
   mais recentes por data:
   ```
   python scripts/build_cinema_data.py --last 5
   ```
   Imagens e metadados em falta continuam a ser tratados para todos os filmes —
   a flag só afeta os pedidos de ratings ao Letterboxd, que são a parte lenta.

   Para atualizar só uma pessoa (por exemplo, alguém que ficou para trás e
   entretanto avaliou tudo), usa `--user` com o nome de exibição:
   ```
   python scripts/build_cinema_data.py --user Geremias
   python scripts/build_cinema_data.py --user Geremias --last 5
   python scripts/build_cinema_data.py --user Geremias --user "Mestre Gui"
   ```
   O nome tem de ser igual ao do `members.json` (espaços e maiúsculas incluídos);
   se te enganares, o script pára e mostra a lista de nomes válidos. Com `--user`
   também só se aplicam as notas manuais desse membro — os outros ficam
   intocados.
4. O script só preenche o que falta: ratings/comentários novos (por membro
   e filme), posters/backdrops em falta, géneros/duração via TMDB, e
   realizadores/elenco/temas da página do filme no Letterboxd para filmes
   novos. **Nunca sobrescreve um rating/comentário já existente** —
   podes sempre editar `src/cdc/cinemaData.json` à mão (ex: para membros
   sem Letterboxd, ou se o scraping falhar para alguém) que a tua edição
   fica.
5. O workflow só faz commit dos dados/imagens — o deploy do site continua
   manual (`npm run deploy`).

## Filmes do mês inteiro (datas no futuro)

Podes pôr no `weekMeta.json` todas as semanas do mês de uma vez, mesmo as que
ainda não chegaram. Um filme cuja semana ainda não começou:

- **entra** no `cinemaData.json` e recebe poster/backdrop/géneros e
  realizadores/elenco/temas — o
  site precisa deles para o anunciar;
- **não** leva scraping de ratings (ninguém o viu ainda, e uma nota antiga de
  alguém no Letterboxd não é a nota da semana do clube);
- não conta para o `--last N` (senão gastavas a flag toda em filmes futuros e
  nem chegavas ao filme desta semana);
- no site fica só na faixa "On the way" — fora do catálogo, das estatísticas e
  do jogo, até ao dia em que a semana dele começa. Isto é decidido no browser
  (`src/cdc/movies.js`), portanto o filme aparece sozinho no dia certo, sem
  precisares de correr nada nem de fazer deploy outra vez.

## Token do TMDB (configurar uma vez)

Abre o `.env` na raiz do projeto e põe o token à frente do `=`:

```
TMDB_API_TOKEN=o_teu_token_aqui
```

O token é o "API Key (v3 auth)" em https://www.themoviedb.org/settings/api.
O `.env` está no `.gitignore`, portanto nunca vai para o repositório — fica só
na tua máquina e não precisas de voltar a mexer nisto.

Se precisares de usar outro token pontualmente, uma variável de ambiente na
linha de comandos ganha ao `.env`.

Nota: isto é só para correres localmente. No workflow do GitHub o token vem do
secret `TMDB_API_TOKEN` do repositório, como até aqui.

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

## Sagas (prequelas e sequelas)

As sagas vêm **sozinhas** do TMDB — o `belongs_to_collection` vem no mesmo pedido
que já se fazia para os géneros, portanto não custa nada e os filmes novos são
tratados automaticamente. O nome fica sem o sufixo `" Collection"`, e um filme
que não pertença a saga nenhuma fica com `"franchise": null` (a chave presente é
o que evita voltar a perguntar em cada corrida).

Usa `scripts/franchises.json` só para corrigir o TMDB. É `nome da saga → lista de
slugs pela ordem da história`:

```json
{ "Hannibal Lecter": ["the-silence-of-the-lambs", "hannibal"] }
```

Sobrepõe-se sempre ao TMDB e serve para três coisas: **renomear** uma saga,
**forçar a ordem** quando a data de estreia não é a ordem da história (o TMDB põe
o Red Dragon de 2002 depois do Hannibal de 2001, quando é anterior a tudo), e
**criar** sagas que o TMDB não modela. Filmes que não estejam neste ficheiro usam
o nome do TMDB e ordenam-se pelo ano.

No site, o card só mostra a prequela/sequela quando ela **já está no clube** —
não faria sentido oferecer um card que não existe. Por isso um filme sozinho na
saga dele (o Blade Runner 2049, por exemplo, sem o de 1982) não mostra secção
nenhuma. O ranking de sagas em `/stats` exige 2 filmes.

## Ficheiros

- `members.json` — mapeamento nome de exibição → username Letterboxd (ou
  `null` se não tiver conta) → ficheiro de pfp.
- `weekMeta.json` — quem escolheu + data de cada filme (input manual).
- `manualRatings.json` — notas dos membros sem Letterboxd (input manual).
- `franchises.json` — correções às sagas (input manual, ver secção abaixo).
- `build_manual_template.py` — gera/atualiza o `manualRatings.json`.
- `build_cinema_data.py` — script principal (scraping + TMDB + merges).
- `build_letterboxd_films.py` — filmes de fora do clube, só para o perfil
  (export + RSS do Letterboxd + TMDB). Ver o README da raiz.
- `lib/letterboxd.py` — leitura do Letterboxd: lista do clube, página do
  filme, nota de cada membro e RSS.
- `lib/letterboxd_export.py` — leitura dos zips do export de dados.
- `lib/tmdb.py` — API do TMDB (posters, géneros, duração, sagas, pesquisa).
- `lib/http.py`, `lib/images.py` — pedidos com delay e retry, e download de
  imagens.
- `letterboxd_exports/` — exports de dados do Letterboxd dos membros (nunca
  versionada: trazem o email).
- `letterboxdSearchCache.json` — gerado. Cache título+ano → ID do TMDB, para
  não repetir pesquisas. Um `null` é um filme que não se encontrou; apaga a
  linha para tentar outra vez.
- `migrate_to_slugs.py` — script one-time já corrido (histórico, não
  precisas de correr outra vez).
