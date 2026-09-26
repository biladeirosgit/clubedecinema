// Filmes que os membros avaliaram no Letterboxd fora do clube
// (cdc/letterboxdFilms.json, gerado pelo build_letterboxd_films.py). So a
// pagina de perfil os usa, e so com o toggle ligado: nao entram no catalogo,
// nas estatisticas do clube nem no jogo.

const POSTER_BASE = 'https://image.tmdb.org/t/p/w185';

// Filmes de fora do clube que um membro tem avaliados (0 sem Letterboxd).
export const letterboxdCount = (films, name) => Object.keys(films?.ratings?.[name] || {}).length;

// Junta ao cinemaData os filmes de fora de todos os membros, no mesmo formato,
// para as funcoes de stats.js funcionarem sem mudar nada. Cada filme fica com
// as notas de todos os que o viram (e o que alimenta os "gostos parecidos"), e
// `watchedAt` com o dia em que cada um o viu. Ficam marcados com
// `external: true` e trazem `poster` (URL do TMDB) em vez de poster local.
export const mergeLetterboxd = (cinemaData, films) => {
    const merged = { ...cinemaData };
    const clubIds = new Set(Object.values(cinemaData).map((m) => m.tmdbId).filter(Boolean));
    Object.entries(films?.ratings || {}).forEach(([member, ratings]) => {
        Object.entries(ratings).forEach(([id, { rating, date }]) => {
            const film = films.films?.[id];
            if (!film || clubIds.has(Number(id))) return;
            const key = `lb-${id}`;
            if (!merged[key]) {
                merged[key] = {
                    title: film.title,
                    year: film.year,
                    minutes: film.minutes || 0,
                    genres: film.genres || [],
                    directors: film.directors || [],
                    cast: film.cast || [],
                    themes: [],
                    chosenBy: [],
                    reviews: {},
                    comments: {},
                    date: null,
                    watchedAt: {},
                    tmdbId: Number(id),
                    link: film.link || `https://www.themoviedb.org/movie/${id}`,
                    poster: film.poster ? `${POSTER_BASE}${film.poster}` : null,
                    external: true,
                };
            }
            merged[key].reviews[member] = rating;
            merged[key].watchedAt[member] = date || null;
        });
    });
    return merged;
};
