# Clube de Cinema

Site do Clube de Cinema dos Biladeiros. Todas as semanas o clube vê um filme,
escolhido à vez por um membro, e cada um dá a sua nota no Letterboxd. O site
junta o histórico dos filmes, as notas e as estatísticas de cada pessoa.

É uma app React (Create React App). Os dados vêm de um pipeline Python que lê a
lista do clube e as notas dos membros no Letterboxd, e os detalhes dos filmes
na API do TMDB.

- **Site:** https://biladeirosgit.github.io/clubedecinema/
- **Lista do clube no Letterboxd:** https://letterboxd.com/surumkata/list/clube-de-cinema/
- **Hub dos Biladeiros:** https://biladeirosgit.github.io/

---

## Funcionalidades

**Catálogo** (página inicial)
- O filme mais recente em destaque.
- Faixa "On the way" com os filmes das semanas que ainda não chegaram.
- Todos os filmes do clube, com pesquisa, filtros por género, por quem escolheu
  e por ano, e ordenação por data, nota ou ano.
- Card de cada filme: realização, elenco, géneros, semana, a nota e o
  comentário de cada membro, e a prequela ou sequela quando também já passou
  pelo clube.

**Estatísticas do clube** (`/stats`)
- Números gerais: filmes, notas, horas vistas, membros.
- Distribuições: notas, décadas, duração.
- Rankings de géneros, temas, realizadores e atores. Ordenam-se pela média ou
  por quantos filmes, e o "Ver todos" abre a lista inteira.
- Filmes mais divisivos e de maior consenso, escolhas incompreendidas, filmes
  mais vistos, pares com gostos mais parecidos e mais opostos, quem dá notas
  mais odiosas, quem mais comenta, melhores recomendadores e melhores sagas.
- Melhores e piores filmes, e o ranking de membros (vistos, média, streaks...).

**Perfil de cada membro** (`/users/<nome>`)
- Números, distribuições e rankings da pessoa, e os membros com gostos mais
  parecidos com os dela.
- Toggle **"Incluir o Letterboxd"**: junta às estatísticas pessoais os filmes
  que a pessoa avaliou no Letterboxd fora do clube. Esses filmes só aparecem no
  perfil. Abrem um card com as notas de todos os membros que os viram.
- Listas das escolhas e dos filmes vistos, com pesquisa, filtros e ordenação.

**Guess** (`/guess`): jogo diário para adivinhar o filme do dia, com pistas.

---

## Guia de comandos

| Quero... | Comando |
| --- | --- |
| Instalar tudo (uma vez) | `npm install` e `pip install -r scripts/requirements.txt` |
| Ver o site no meu PC | `npm start` (abre http://localhost:3000) |
| Atualizar os dados do clube (notas, filmes novos) | `python scripts/build_cinema_data.py --last 5` |
| Atualizar tudo, filme a filme | `python scripts/build_cinema_data.py` |
| Atualizar só uma pessoa | `python scripts/build_cinema_data.py --user Geremias` |
| Atualizar os filmes de fora do clube (perfil) | `python scripts/build_letterboxd_films.py` |
| Preparar as notas de quem não tem Letterboxd | `python scripts/build_manual_template.py` |
| Correr os testes | `npm test` (fica a vigiar; `q` para sair) |
| Correr os testes uma vez | `npx react-scripts test --watchAll=false` |
| Guardar as alterações no GitHub | `git add -A`, `git commit -m "..."`, `git push` |
| Publicar o site | `npm run deploy` |

Todos os comandos correm na raiz do repositório
(`C:\Users\35191\Desktop\clubedecinema`).

---

## Setup inicial (uma vez só)

```powershell
npm install                              # dependências do site
pip install -r scripts/requirements.txt  # dependências do pipeline
```

Depois copia o `.env.example` para `.env` e mete o token do TMDB:

```
TMDB_API_TOKEN=o_teu_token_aqui
```

O token é o *API Key (v3 auth)* em https://www.themoviedb.org/settings/api.
O `.env` está no `.gitignore` e fica só na tua máquina.

---

## Tarefas comuns

### Adicionar os filmes do mês

1. Adiciona os filmes à lista do clube no Letterboxd.
2. Acrescenta uma entrada por filme em `scripts/weekMeta.json`, com quem
   escolheu e a data de início da semana (domingo). **Sem isto o filme não
   aparece no site.** A chave é o slug do Letterboxd, a parte final de
   `letterboxd.com/film/<slug>/`:
   ```json
   "nome-do-filme": { "chosenBy": ["Geremias"], "date": "26/07/2026" }
   ```
3. Corre o pipeline:
   ```powershell
   python scripts/build_cinema_data.py --last 5
   ```
4. Guarda e publica:
   ```powershell
   git add -A
   git commit -m "Filmes de agosto"
   git push
   npm run deploy
   ```

Podes pôr já as semanas que ainda não chegaram. Um filme cuja semana ainda não
começou fica **só na faixa "On the way"**: fora do catálogo, das estatísticas e
do jogo. Aparece sozinho no dia em que a semana começa, porque a comparação é
feita no browser. Não precisas de correr nada nem de voltar a fazer deploy.

### Atualizar as notas da semana

```powershell
python scripts/build_cinema_data.py --last 5
git add -A
git commit -m "Notas da semana"
git push
npm run deploy
```

O `--last 5` só vai buscar notas aos 5 filmes mais recentes que já chegaram. É
muito mais rápido e é o que queres quase sempre. Posters e detalhes em falta
continuam a ser tratados para todos os filmes.

Para apanhar alguém que avaliou filmes antigos, usa `--user`:

```powershell
python scripts/build_cinema_data.py --user Geremias
python scripts/build_cinema_data.py --user Geremias --user "Mestre Gui"
```

O nome tem de ser igual ao do `members.json`, com espaços e maiúsculas.

### Notas dos membros sem Letterboxd

Metade dos membros não tem Letterboxd, por isso as notas deles entram à mão.

```powershell
python scripts/build_manual_template.py
```

Este comando (re)cria `scripts/manualRatings.json` com, por membro, os filmes
que ainda não têm nota. Preenche o `rating` (0.5 a 5) nos que a pessoa viu e
deixa `null` nos outros:

```json
"Atlas": {
    "lost-in-translation": { "rating": 4.5, "title": "Lost in Translation (2003)" },
    "drive-2011": { "rating": null, "title": "Drive (2011)" }
}
```

Depois corre `python scripts/build_cinema_data.py` para juntar as notas. Podes
voltar a gerar o template quando quiseres: preserva o que já preencheste. O
mesmo ficheiro serve para forçar a nota de um membro *com* Letterboxd.

### Filmes de fora do clube (toggle do perfil)

Estes filmes vivem em `src/cdc/letterboxdFilms.json` e são atualizados por um
script à parte, que não mexe nos dados do clube:

```powershell
python scripts/build_letterboxd_films.py                    # todos os membros
python scripts/build_letterboxd_films.py --user Geremias    # só um
```

O Letterboxd protege com o Cloudflare a lista completa de filmes de cada
membro, por isso o script usa duas fontes:

1. **O export de dados de cada membro, uma vez.** Cada pessoa vai a
   *Letterboxd → Settings → Data → Export your data*, descarrega o zip e
   manda-to. Guarda-o, sem mudar o nome, em `scripts/letterboxd_exports/`. O
   script descobre de quem é pelo próprio zip. Esta pasta **nunca vai para o
   GitHub** (está no `.gitignore`), porque o export traz o email e o resto do
   perfil.
2. **O RSS de cada membro, em todas as corridas.** Só traz as últimas ~50
   entradas do diário, mas chega para ir apanhando o que cada um vê. O ficheiro
   acumula, por isso correr o script de vez em quando mantém-no em dia mesmo sem
   exports novos.

Os detalhes de cada filme (duração, géneros, realizadores, elenco, poster) vêm
do TMDB. Os temas só existem nos filmes do clube. Um filme que não se encontre
fica de fora e o script lista-o no fim. Cada 800 notas demoram uns 3 a 4
minutos na primeira vez; depois ficam em cache.

### Membro novo

1. Acrescenta-o a `scripts/members.json`, com o username do Letterboxd (ou
   `null` se não tiver):
   ```json
   "Nome": { "letterboxdUsername": "username", "pfp": "Nome.png" }
   ```
2. Mete a foto em `public/pfp/Nome.png`.
3. Corre `python scripts/build_cinema_data.py` para ir buscar as notas dele.

### Corrigir uma saga

As sagas (prequelas e sequelas) vêm sozinhas do TMDB. Para as corrigir, usa
`scripts/franchises.json` (nome da saga → slugs pela ordem da história). Ver
[scripts/README.md](scripts/README.md#sagas-prequelas-e-sequelas).

### Correr o pipeline pelo GitHub Actions

Em alternativa a correr no PC: separador **Actions** → *Update cinema data* →
**Run workflow**. Usa o secret `TMDB_API_TOKEN` do repositório e faz commit
dos dados e das imagens. O deploy continua a ser manual: depois faz `git pull`
e `npm run deploy`.

---

## Como funciona o pipeline

O `build_cinema_data.py` escreve em `src/cdc/cinemaData.json` e descarrega os
posters e fundos para `public/posters/` e `public/backgrounds/`.

Pode correr-se as vezes que se quiser:
- Nunca sobrescreve uma nota ou comentário que já lá esteja, venha do
  Letterboxd ou tenha sido escrito à mão. Podes editar o `cinemaData.json` à
  mão e a edição sobrevive.
- Só descarrega imagens que ainda não existam.
- Só chama o TMDB para filmes a que falte alguma coisa.

Detalhe completo em [scripts/README.md](scripts/README.md).

---

## Ficheiros que editas à mão

| Ficheiro | Para quê |
| --- | --- |
| `scripts/weekMeta.json` | Quem escolheu e data da semana de cada filme |
| `scripts/manualRatings.json` | Notas dos membros sem Letterboxd |
| `scripts/members.json` | Membros: nome → username do Letterboxd (ou `null`) → foto |
| `scripts/franchises.json` | Correções às sagas |
| `scripts/letterboxd_exports/` | Exports do Letterboxd de cada membro (local, não versionado) |
| `public/pfp/<Nome>.png` | Foto de cada membro |
| `.env` | Token do TMDB (local, não versionado) |

Os nomes em `chosenBy` têm de ser iguais às chaves do `members.json`. As datas
são `DD/MM/YYYY`.

---

## Estrutura

```
src/cdc/              páginas do clube e dados gerados
src/cdc/cinemaData.json      filmes do clube (gerado)
src/cdc/letterboxdFilms.json filmes de fora do clube, só para o perfil (gerado)
src/cdc/movies.js     ponto de entrada dos dados: separa os filmes que já
                      chegaram dos que estão a caminho. As páginas importam
                      daqui, nunca o cinemaData.json cru.
src/components/       peças partilhadas (linhas de filme, barras, navbar...)
src/utils/            cálculos das estatísticas, datas, filtros
scripts/              pipeline Python (ver scripts/README.md)
public/               posters/, backgrounds/, pfp/
build/                output do npm run build (não versionado)
```

---

## Resolução de problemas

**`RuntimeError: TMDB_API_TOKEN nao definido`:** o `.env` na raiz não existe ou
está vazio. Ver *Setup inicial*.

**Um filme não aparece no site:** falta a entrada no `scripts/weekMeta.json` (o
script avisa no fim), ou a semana dele ainda não chegou (está em "On the way").

**`ERRO FATAL: ... bloqueou`:** o Letterboxd bloqueou os pedidos. O script sai
sem gravar nada a meio. Espera um pouco e tenta outra vez, de preferência com
`--last N`.

**Falta o poster de um filme:** o script avisa quando não encontra o filme no
TMDB. Podes pôr a imagem à mão em `public/posters/<slug>.png`.

**`detected dubious ownership in repository`:** o repositório foi criado ou
clonado num terminal de administrador. Corre uma vez:
```powershell
git config --global --add safe.directory C:/Users/35191/Desktop/clubedecinema
```

**`npm run deploy` dá `Failed to get remote.origin.url`:** a cache do
`gh-pages` ficou com outro dono (o mesmo problema de cima). Apaga-a e volta a
publicar:
```powershell
npx gh-pages-clean
npm run deploy
```
