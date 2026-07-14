import { average } from './ratings';

const MIN_SHARED = 10; // minimo de filmes em comum para afinidade ser fiavel / entrar no top

// Lista de nomes de exibicao que avaliaram pelo menos um filme.
export const allReviewers = (cinemaData) => {
    const set = new Set();
    Object.values(cinemaData).forEach((movie) => {
        Object.keys(movie.reviews || {}).forEach((name) => set.add(name));
    });
    return Array.from(set);
};

// Afinidade entre dois membros: % de filmes partilhados em que concordam
// (diferenca de nota <= 0.5), so sobre filmes que ambos viram.
// Devolve null se tiverem menos de MIN_SHARED filmes em comum.
export const affinity = (cinemaData, a, b) => {
    let agree = 0;
    let n = 0;
    Object.values(cinemaData).forEach((movie) => {
        const ra = movie.reviews?.[a];
        const rb = movie.reviews?.[b];
        if (ra != null && rb != null) {
            if (Math.abs(ra - rb) <= 0.5) agree += 1;
            n += 1;
        }
    });
    if (n < MIN_SHARED) return null;
    // shared = filmes que ambos avaliaram; agree = quantos com nota a <=0.5 de distancia
    return { score: agree / n, shared: n, agree };
};

// Todos os pares de membros ordenados por afinidade (desc).
export const affinityPairs = (cinemaData) => {
    const names = allReviewers(cinemaData);
    const pairs = [];
    for (let i = 0; i < names.length; i += 1) {
        for (let j = i + 1; j < names.length; j += 1) {
            const res = affinity(cinemaData, names[i], names[j]);
            if (res) pairs.push({ a: names[i], b: names[j], ...res });
        }
    }
    pairs.sort((x, y) => y.score - x.score);
    return pairs;
};

// Membros mais parecidos com um dado membro (desc por afinidade).
export const mostSimilarTo = (cinemaData, name) => {
    const names = allReviewers(cinemaData).filter((n) => n !== name);
    return names
        .map((other) => ({ name: other, ...(affinity(cinemaData, name, other) || {}) }))
        .filter((x) => x.score != null)
        .sort((x, y) => y.score - x.score);
};

// Filmes que um membro ainda nao avaliou (slugs).
export const unratedByUser = (cinemaData, name) =>
    Object.entries(cinemaData)
        .filter(([, movie]) => !(name in (movie.reviews || {})))
        .map(([slug]) => slug);

// Quantos filmes faltam avaliar a cada membro (so membros que ja participaram).
export const missingCountByMember = (cinemaData) => {
    const total = Object.keys(cinemaData).length;
    const names = allReviewers(cinemaData);
    return names
        .map((name) => {
            const rated = Object.values(cinemaData).filter((m) => name in (m.reviews || {})).length;
            return { name, missing: total - rated, rated };
        })
        .sort((x, y) => x.missing - y.missing);
};

export { average };
