import { average } from './ratings';

export const MIN_SHARED = 5; // minimo de filmes em comum para a sintonia ser fiavel / entrar no top
export const AFFINITY_SHRINK = 10; // puxa para 0 a sintonia de pares com poucos filmes em comum
export const MIN_RECOMMENDATIONS = 3; // minimo de escolhas avaliadas por outros para entrar no ranking de sugestoes
export const MIN_CROSS_RATED = 3; // minimo de filmes de uma pessoa avaliados por outra para o par contar
export const MIN_GENRE_MOVIES = 3; // minimo de filmes de um genero para a media dele ser fiavel
export const MIN_CREDIT_MOVIES = 3; // idem para atores, que se repetem muito menos
export const MIN_DIRECTOR_MOVIES = 2; // e os realizadores ainda menos: a 3 filmes so 6 entravam, a 2 sao 18
export const MIN_FRANCHISE_MOVIES = 2; // uma saga so conta quando ha ligacao entre pelo menos dois filmes
export const MIN_OWN_CHOICES = 2; // diferenca entre a nota propria e a dos outros: pede menos escolhas que os rankings de sugestao, que comparam medias
export const MIN_OTHER_RATINGS = 4; // notas de gente que nao escolheu o filme, para a media "do clube" nesse filme valer alguma coisa
export const MIN_HARSHNESS_MOVIES = 8; // filmes avaliados para o desvio de uma pessoa face ao clube ser um habito e nao um dia mau
export const MIN_SPREAD_RATINGS = 5; // com poucas notas o desacordo num filme e ruido, nao discussao

// Lista de nomes de exibicao que avaliaram pelo menos um filme.
export const allReviewers = (cinemaData) => {
    const set = new Set();
    Object.values(cinemaData).forEach((movie) => {
        Object.keys(movie.reviews || {}).forEach((name) => set.add(name));
    });
    return Array.from(set);
};

// Sintonia entre dois membros: correlacao de Pearson sobre os filmes que ambos
// avaliaram. Mede se as notas sobem e descem juntas, nao se sao iguais -- quem
// avalia sempre meia estrela abaixo do outro nao esta a discordar de nada, e o
// Pearson desconta essa diferenca (e a de escala) de borla. Uma media de
// distancias nao conseguia isso, e um limiar binario ainda menos: com ele um
// desvio de 3 estrelas pesava o mesmo que um de 1.
//
// O `score` e o r encolhido para 0 por n/(n+AFFINITY_SHRINK). Sem isso um par
// com 12 filmes e sorte batia um com 58, quando 58 filmes sao evidencia muito
// mais forte. E o `score` que manda nos rankings; o `r` cru fica disponivel.
//
// Devolve tambem o que a correlacao ignora de proposito, para a UI poder
// mostrar: `bias` (quanto `a` da a mais que `b`, em media) e `agree` (filmes a
// menos de meia estrela de distancia).
//
// null com menos de MIN_SHARED filmes em comum, ou se um deles deu sempre a
// mesma nota — sem variacao nao ha correlacao que medir.
export const affinity = (cinemaData, a, b) => {
    const xs = [];
    const ys = [];
    Object.values(cinemaData).forEach((movie) => {
        const ra = movie.reviews?.[a];
        const rb = movie.reviews?.[b];
        if (ra != null && rb != null) {
            xs.push(ra);
            ys.push(rb);
        }
    });

    const n = xs.length;
    if (n < MIN_SHARED) return null;

    const mx = xs.reduce((sum, v) => sum + v, 0) / n;
    const my = ys.reduce((sum, v) => sum + v, 0) / n;
    let cov = 0;
    let varX = 0;
    let varY = 0;
    let agree = 0;
    for (let i = 0; i < n; i += 1) {
        const dx = xs[i] - mx;
        const dy = ys[i] - my;
        cov += dx * dy;
        varX += dx * dx;
        varY += dy * dy;
        if (Math.abs(xs[i] - ys[i]) <= 0.5) agree += 1;
    }
    if (varX === 0 || varY === 0) return null;

    const r = cov / Math.sqrt(varX * varY);
    return { r, score: r * (n / (n + AFFINITY_SHRINK)), shared: n, agree, bias: mx - my };
};

// Todos os pares de membros ordenados por sintonia (desc). A cauda da lista
// sao os gostos mais opostos: com o Pearson, `score` negativo quer mesmo dizer
// que quando um sobe o outro desce.
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

// Membros mais em sintonia com um dado membro (desc).
export const mostSimilarTo = (cinemaData, name) => {
    const names = allReviewers(cinemaData).filter((n) => n !== name);
    return names
        .map((other) => ({ name: other, ...(affinity(cinemaData, name, other) || {}) }))
        .filter((x) => x.score != null)
        .sort((x, y) => y.score - x.score);
};

// Quanto o clube discordou em cada filme: desvio-padrao das notas, do mais
// divisivo para o mais consensual. Quem quiser o lado do consenso le a lista
// ao contrario. Filmes com poucas notas ficam de fora -- duas pessoas em
// desacordo nao sao o clube dividido.
export const ratingSpread = (cinemaData, minRatings = MIN_SPREAD_RATINGS) =>
    Object.entries(cinemaData)
        .map(([slug, movie]) => {
            const ratings = Object.values(movie.reviews || {});
            if (ratings.length < minRatings) return null;
            const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
            const variance = ratings.reduce((sum, r) => sum + (r - mean) ** 2, 0) / ratings.length;
            return { slug, movie, spread: Math.sqrt(variance), average: mean, count: ratings.length };
        })
        .filter(Boolean)
        .sort((a, b) => b.spread - a.spread);

// Filmes onde quem os trouxe e o resto do clube mais divergiram: nota de quem
// escolheu menos a media de todos os outros, do mais incompreendido para o
// menos. Positivo = gostou mais do que o clube gostou.
//
// E a versao por filme do ownChoiceBias, que faz a mesma conta mas por pessoa.
// Quando a escolha foi a meias, o lado "dele" e a media dos dois escolhedores
// e nenhum deles entra na media dos outros.
export const misunderstoodChoices = (cinemaData, minOthers = MIN_OTHER_RATINGS) =>
    Object.entries(cinemaData)
        .map(([slug, movie]) => {
            const chosenBy = movie.chosenBy || [];
            const own = chosenBy.map((name) => movie.reviews?.[name]).filter((r) => r != null);
            if (own.length === 0) return null; // escolheu mas nao avaliou

            const others = Object.entries(movie.reviews || {})
                .filter(([name]) => !chosenBy.includes(name))
                .map(([, rating]) => rating);
            if (others.length < minOthers) return null;

            const ownAvg = own.reduce((sum, r) => sum + r, 0) / own.length;
            const othersAvg = others.reduce((sum, r) => sum + r, 0) / others.length;
            return { slug, movie, chosenBy, own: ownAvg, others: othersAvg, count: others.length, gap: ownAvg - othersAvg };
        })
        .filter(Boolean)
        .sort((a, b) => b.gap - a.gap);

// Quanta gente cada filme juntou, do mais visto para o menos. Leva tambem a
// media, que e o que a lista nao mostra: um filme muito visto pode ser muito
// visto e mau.
export const movieAudience = (cinemaData) =>
    Object.entries(cinemaData)
        .map(([slug, movie]) => ({
            slug,
            movie,
            count: Object.keys(movie.reviews || {}).length,
            average: average(movie.reviews),
        }))
        .sort((a, b) => b.count - a.count);

// Quem e odioso: nao quem da notas baixas, mas quem afunda um filme mesmo
// quando isso nao e habito dele.
//
// Primeiro tira-se o vies de cada um -- o quanto costuma dar acima ou abaixo do
// clube. E a mesma correcao que a `affinity` faz: quem da sempre meia estrela a
// menos nao esta a ser odioso com ninguem, e so a escala dele, e isso nao pode
// contar. Do que sobra olha-se so para o lado de baixo: a media de quanto ficou
// abaixo, nos filmes em que ficou abaixo.
//
//   desvio      = (nota − media dos outros no filme) − vies da pessoa
//   odiosidade  = media dos desvios negativos
//
// Mais negativo = mais odioso. Leva o `worst`, o veredicto mais odioso de
// todos, que e o que torna o numero concreto.
export const ratingOdiousness = (cinemaData, minMovies = MIN_HARSHNESS_MOVIES, minOthers = MIN_OTHER_RATINGS) => {
    const acc = {}; // nome -> [{ slug, title, own, others, gap }]
    Object.entries(cinemaData).forEach(([slug, movie]) => {
        const reviews = Object.entries(movie.reviews || {});
        reviews.forEach(([name, rating]) => {
            const others = reviews.filter(([other]) => other !== name).map(([, r]) => r);
            if (others.length < minOthers) return;
            const othersAvg = others.reduce((sum, r) => sum + r, 0) / others.length;
            if (!acc[name]) acc[name] = [];
            acc[name].push({ slug, title: movie.title, own: rating, others: othersAvg, gap: rating - othersAvg });
        });
    });

    return Object.entries(acc)
        .filter(([, seen]) => seen.length >= minMovies)
        .map(([name, seen]) => {
            const bias = seen.reduce((sum, m) => sum + m.gap, 0) / seen.length;
            const below = seen
                .map((m) => ({ ...m, deviation: m.gap - bias }))
                .filter((m) => m.deviation < 0)
                .sort((a, b) => a.deviation - b.deviation);
            if (below.length === 0) return null; // deu sempre exatamente o seu vies
            return {
                name,
                average: below.reduce((sum, m) => sum + m.deviation, 0) / below.length,
                count: below.length,
                rated: seen.length,
                bias,
                worst: below[0],
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.average - b.average);
};

// Em quantos filmes cada um deixou comentario. Cada pessoa tem um comentario
// por filme (`comments[nome]` e uma string, quebras de linha incluidas), por
// isso isto e mesmo uma contagem de filmes: ou comentou ou nao comentou.
// O `rate` e sobre os filmes que essa pessoa viu, que e a medida justa -- em
// volume ganha sempre quem ca anda ha mais tempo.
export const commenterRanking = (cinemaData) => {
    const acc = {}; // nome -> { commented, watched }
    const entry = (name) => acc[name] || (acc[name] = { commented: 0, watched: 0 });
    Object.values(cinemaData).forEach((movie) => {
        Object.keys(movie.reviews || {}).forEach((name) => { entry(name).watched += 1; });
        Object.entries(movie.comments || {}).forEach(([name, text]) => {
            if (text && text.trim()) entry(name).commented += 1;
        });
    });
    return Object.entries(acc)
        .map(([name, { commented, watched }]) => ({
            name,
            count: commented,
            watched,
            rate: watched ? commented / watched : 0,
        }))
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count || b.rate - a.rate);
};

// Escaloes de duracao. `max` e exclusivo; o ultimo nao tem topo.
export const RUNTIME_BUCKETS = [
    { label: '< 90 min', max: 90 },
    { label: '90–110', max: 110 },
    { label: '110–130', max: 130 },
    { label: '130–150', max: 150 },
    { label: '150+ min', max: Infinity },
];

// A nota de um filme nas distribuicoes (decada, duracao). Sem `name` e a media
// do clube; com `name` e a nota dessa pessoa, ou null se nao o viu.
const distributionRating = (movie, name) => (name ? movie.reviews?.[name] ?? null : average(movie.reviews));

// O catalogo por duracao, pela mesma receita das decadas: conta os filmes de
// cada escalao e faz a media das medias. Pela ordem dos escaloes, nao por nota.
// Com `name` so conta os filmes que essa pessoa viu, e a media e a das notas dela.
export const runtimeStats = (cinemaData, name = null) => {
    const acc = RUNTIME_BUCKETS.map(({ label }) => ({ label, count: 0, sum: 0, rated: 0 }));
    Object.values(cinemaData).forEach((movie) => {
        if (!movie.minutes) return;
        const avg = distributionRating(movie, name);
        if (name && avg == null) return;
        const i = RUNTIME_BUCKETS.findIndex((b) => movie.minutes < b.max);
        if (i < 0) return;
        acc[i].count += 1;
        if (avg != null) {
            acc[i].sum += avg;
            acc[i].rated += 1;
        }
    });
    return acc.map(({ label, count, sum, rated }) => ({
        label,
        count,
        average: rated ? sum / rated : null,
    }));
};

// O catalogo por decada de estreia, da mais antiga para a mais recente --
// linha do tempo, nao ranking. `average` e null numa decada que ninguem
// avaliou ainda. Com `name` so conta os filmes que essa pessoa viu, e a media
// e a das notas dela.
export const decadeStats = (cinemaData, name = null) => {
    const acc = {}; // decada -> { count, sum, rated }
    Object.values(cinemaData).forEach((movie) => {
        if (!movie.year) return;
        const avg = distributionRating(movie, name);
        if (name && avg == null) return;
        const decade = Math.floor(movie.year / 10) * 10;
        if (!acc[decade]) acc[decade] = { count: 0, sum: 0, rated: 0 };
        acc[decade].count += 1;
        if (avg != null) {
            acc[decade].sum += avg;
            acc[decade].rated += 1;
        }
    });
    return Object.entries(acc)
        .map(([decade, { count, sum, rated }]) => ({
            decade: Number(decade),
            count,
            average: rated ? sum / rated : null,
        }))
        .sort((a, b) => a.decade - b.decade);
};

// Filmes que um membro ainda nao avaliou (slugs), dos mais bem avaliados pelo
// clube para os piores — assim a lista sugere primeiro o que vale a pena ver.
// Os que ainda ninguem avaliou vao para o fim.
export const unratedByUser = (cinemaData, name) =>
    Object.entries(cinemaData)
        .filter(([, movie]) => !(name in (movie.reviews || {})))
        .sort(([, a], [, b]) => (average(b.reviews) ?? -1) - (average(a.reviews) ?? -1))
        .map(([slug]) => slug);

// As notas sao meias estrelas (0.5 a 5), por isso a distribuicao e indexada
// pelo dobro da nota: 1 = meia estrela, 10 = cinco estrelas.
export const RATING_BUCKETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Quantas notas de cada valor foram dadas. Sem `name` conta as do clube todo,
// com `name` so as dessa pessoa.
export const ratingDistribution = (cinemaData, name = null) => {
    const counts = {};
    Object.values(cinemaData).forEach((movie) => {
        const ratings = name
            ? [movie.reviews?.[name]].filter((r) => r != null)
            : Object.values(movie.reviews || {});
        ratings.forEach((rating) => {
            counts[rating * 2] = (counts[rating * 2] || 0) + 1;
        });
    });
    return counts;
};

// Filmes de uma saga, por ordem da historia. O `franchiseOrder` vem do
// franchises.json e manda sobre o ano; sem ele, ordena-se pela data de estreia.
// Como o cinemaData ja vem filtrado (ver movies.js), so aparecem filmes que o
// clube ja viu — que sao os unicos cujo card se pode abrir.
export const franchiseMembers = (cinemaData, name) =>
    Object.entries(cinemaData)
        .filter(([, movie]) => movie.franchise === name)
        .map(([slug, movie]) => ({ slug, movie }))
        .sort((a, b) => (a.movie.franchiseOrder ?? a.movie.year) - (b.movie.franchiseOrder ?? b.movie.year));

// Prequela e sequela de um filme dentro da saga dele, ou null quando esta na
// ponta (ou quando nao pertence a saga nenhuma).
export const franchiseNeighbours = (cinemaData, slug) => {
    const name = cinemaData[slug]?.franchise;
    if (!name) return { prequel: null, sequel: null };
    const members = franchiseMembers(cinemaData, name);
    const i = members.findIndex((m) => m.slug === slug);
    return {
        prequel: i > 0 ? members[i - 1] : null,
        sequel: i >= 0 && i < members.length - 1 ? members[i + 1] : null,
    };
};

// Ranking das sagas pela media dos filmes que o clube viu. Cada filme pesa o
// mesmo. So contam as sagas com ligacao, ou seja com 2+ filmes no clube.
export const franchiseRanking = (cinemaData, minMovies = MIN_FRANCHISE_MOVIES) => {
    const acc = {}; // saga -> { sum, count, movies }
    Object.entries(cinemaData).forEach(([slug, movie]) => {
        if (!movie.franchise) return;
        const avg = average(movie.reviews);
        if (avg == null) return; // ninguem avaliou -> nao conta
        if (!acc[movie.franchise]) acc[movie.franchise] = { sum: 0, count: 0, movies: [] };
        acc[movie.franchise].sum += avg;
        acc[movie.franchise].count += 1;
        acc[movie.franchise].movies.push({
            slug,
            title: movie.title,
            year: movie.year,
            rating: avg,
            chosenBy: movie.chosenBy || [],
        });
    });
    return Object.entries(acc)
        .map(([name, { sum, count, movies }]) => {
            // Pela ordem da saga, nao pela nota: a lista e para se ler como a saga.
            // Cada filme leva o seu chosenBy, que e o que a capa mostra.
            const ordered = movies.sort((a, b) => a.year - b.year);
            return { name, average: sum / count, count, movies: ordered };
        })
        .filter((f) => f.count >= minMovies)
        .sort((a, b) => b.average - a.average || b.count - a.count);
};

// Quantos filmes ha de cada valor de um campo-lista do filme (`genres`,
// `directors`, `cast`, `themes`), do mais comum para o menos. Sem `name` conta o
// catalogo todo; com `name` so os filmes que essa pessoa escolheu. Um filme
// conta para todos os valores que tem.
export const creditCounts = (cinemaData, field, name = null) => {
    const counts = {};
    Object.values(cinemaData).forEach((movie) => {
        if (name && !(movie.chosenBy || []).includes(name)) return;
        (movie[field] || []).forEach((value) => {
            counts[value] = (counts[value] || 0) + 1;
        });
    });
    return Object.entries(counts)
        .map(([value, count]) => ({ name: value, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

// Ranking dos valores de um campo-lista pela nota media. Sem `name` usa a media
// do clube em cada filme; com `name` usa so as notas dessa pessoa — ou seja, o
// counts fala do que a pessoa escolheu e o ranking do que ela viu. Valores com
// poucos filmes ficam de fora porque um unico filme muito bom ou muito mau
// punha-os logo no topo.
export const creditRanking = (cinemaData, field, name = null, minMovies = MIN_GENRE_MOVIES) => {
    const acc = {}; // valor -> { sum, count, movies }
    Object.entries(cinemaData).forEach(([slug, movie]) => {
        const rating = name ? movie.reviews?.[name] : average(movie.reviews);
        if (rating == null) return;
        (movie[field] || []).forEach((value) => {
            if (!acc[value]) acc[value] = { sum: 0, count: 0, movies: [] };
            acc[value].sum += rating;
            acc[value].count += 1;
            // Que filmes sustentam a media, do melhor para o pior. Quem tem
            // muitos (um genero) nao vai querer a lista toda; quem tem tres
            // (um realizador) vive disto.
            acc[value].movies.push({ slug, title: movie.title, year: movie.year, rating });
        });
    });
    return Object.entries(acc)
        .map(([value, { sum, count, movies }]) => ({
            name: value,
            average: sum / count,
            count,
            movies: movies.sort((a, b) => b.rating - a.rating),
        }))
        .filter((x) => x.count >= minMovies)
        .sort((a, b) => b.average - a.average || b.count - a.count);
};

export const genreCounts = (cinemaData, name = null) => creditCounts(cinemaData, 'genres', name);

export const genreRanking = (cinemaData, name = null, minMovies = MIN_GENRE_MOVIES) =>
    creditRanking(cinemaData, 'genres', name, minMovies);

// Media das notas de um filme ignorando um conjunto de nomes (tipicamente quem
// o escolheu). Devolve null se nao sobrar nenhuma nota — o filme e ignorado,
// nunca conta como 0.
export const averageExcluding = (movie, excluded = []) => {
    const skip = new Set(excluded);
    const reviews = Object.fromEntries(
        Object.entries(movie.reviews || {}).filter(([name]) => !skip.has(name))
    );
    return average(reviews);
};

// Base dos rankings de sugeridores: percorre os filmes e acumula, por cada
// nome do chosenBy, o valor devolvido por `valueOf`. Se `valueOf` devolver null
// o filme nao conta de todo — nem para a media nem para o minimo. Filmes
// co-escolhidos contam para os dois nomes.
const rankSuggesters = (cinemaData, valueOf, minMovies) => {
    const acc = {}; // nome -> { sum, count }
    Object.values(cinemaData).forEach((movie) => {
        const chosenBy = movie.chosenBy || [];
        if (chosenBy.length === 0) return;
        const value = valueOf(movie, chosenBy);
        if (value == null) return;
        chosenBy.forEach((name) => {
            if (!acc[name]) acc[name] = { sum: 0, count: 0 };
            acc[name].sum += value;
            acc[name].count += 1;
        });
    });
    return Object.entries(acc)
        .map(([name, { sum, count }]) => ({ name, average: sum / count, count }))
        .filter((x) => x.count >= minMovies)
        .sort((a, b) => b.average - a.average || b.count - a.count);
};

// Ranking de quem sugere os melhores filmes: media das medias dos filmes que
// escolheu, sem a nota do proprio (nem a do co-escolhedor). Filmes que mais
// ninguem avaliou sao saltados por completo, senao quem sugeriu era penalizado.
export const suggesterRanking = (cinemaData, minMovies = MIN_RECOMMENDATIONS) =>
    rankSuggesters(cinemaData, (movie, chosenBy) => averageExcluding(movie, chosenBy), minMovies);

// Ranking de quem leva mais gente a ver: media de pessoas que avaliaram cada
// filme que escolheu. Aqui um filme que ninguem viu conta mesmo como 0 — e
// precisamente o que a metrica quer medir.
export const suggesterAudience = (cinemaData, minMovies = MIN_RECOMMENDATIONS) =>
    rankSuggesters(cinemaData, (movie) => Object.keys(movie.reviews || {}).length, minMovies);

// Ranking pela epoca dos filmes que cada um traz: media do ano de estreia das
// suas escolhas. Do mais antigo para o mais recente, porque as duas pontas da
// lista sao as interessantes -- quem desenterra classicos e quem so traz
// estreias. Um filme sem ano nao conta.
export const suggesterYears = (cinemaData, minMovies = MIN_RECOMMENDATIONS) =>
    rankSuggesters(cinemaData, (movie) => movie.year || null, minMovies)
        .sort((a, b) => a.average - b.average || b.count - a.count);

// O mesmo por nome e sem minimo, para a coluna da tabela de membros.
export const suggesterAverages = (cinemaData) =>
    Object.fromEntries(suggesterRanking(cinemaData, 0).map((s) => [s.name, s]));

// Quanto cada um gosta mais das proprias escolhas do que o resto do clube:
// media de (nota dele no filme que trouxe) menos (media dos outros no mesmo
// filme). Positivo quer dizer que gosta mais do que traz do que o clube gosta.
// A nota de quem co-escolheu tambem fica de fora da media dos outros, senao um
// filme trazido a meias comparava-se com metade de si proprio.
// E o complemento do suggesterRanking, que exclui a nota do proprio justamente
// para a media nao ser inflacionada por ela -- aqui mede-se essa inflacao.
export const ownChoiceBias = (cinemaData, minMovies = MIN_OWN_CHOICES) => {
    const acc = {}; // nome -> { sum, count }
    Object.values(cinemaData).forEach((movie) => {
        const chosenBy = movie.chosenBy || [];
        if (chosenBy.length === 0) return;
        const others = averageExcluding(movie, chosenBy);
        if (others == null) return; // so o proprio avaliou: nada com que comparar
        chosenBy.forEach((name) => {
            const own = movie.reviews?.[name];
            if (own == null) return; // escolheu mas nao avaliou
            if (!acc[name]) acc[name] = { sum: 0, count: 0 };
            acc[name].sum += own - others;
            acc[name].count += 1;
        });
    });
    return Object.entries(acc)
        .map(([name, { sum, count }]) => ({ name, average: sum / count, count }))
        .filter((x) => x.count >= minMovies)
        .sort((a, b) => b.average - a.average || b.count - a.count);
};

// Matriz (quem escolheu) x (quem avaliou): matrix[escolheu][avaliou] = { sum, count }.
// Filme co-escolhido entra nas duas linhas. Inclui a nota do proprio — quem a
// quiser de fora filtra-a.
export const suggesterRaterMatrix = (cinemaData) => {
    const matrix = {};
    Object.values(cinemaData).forEach((movie) => {
        (movie.chosenBy || []).forEach((suggester) => {
            const row = matrix[suggester] || (matrix[suggester] = {});
            Object.entries(movie.reviews || {}).forEach(([rater, rating]) => {
                const cell = row[rater] || (row[rater] = { sum: 0, count: 0 });
                cell.sum += rating;
                cell.count += 1;
            });
        });
    });
    return matrix;
};

// Quem gosta (e quem odeia) das escolhas de `name`: media que cada um deu aos
// filmes que ele escolheu, do maior fa ao maior hater. Exclui o proprio.
// Sem minimo de propositio — com um minimo alto a lista ficava vazia para
// quase toda a gente. Basta ter visto uma escolha para aparecer.
export const ratersOfSuggester = (cinemaData, name) =>
    Object.entries(suggesterRaterMatrix(cinemaData)[name] || {})
        .filter(([rater]) => rater !== name)
        .map(([rater, cell]) => ({ name: rater, average: cell.sum / cell.count, count: cell.count }))
        .sort((a, b) => b.average - a.average || b.count - a.count);

// De quem `name` mais gosta das escolhas: media que ele deu aos filmes de cada
// sugeridor. Inclui as escolhas do proprio, de proposito.
export const suggestersRatedBy = (cinemaData, name, min = MIN_CROSS_RATED) =>
    Object.entries(suggesterRaterMatrix(cinemaData))
        .map(([suggester, row]) => ({ suggester, cell: row[name] }))
        .filter(({ cell }) => cell && cell.count >= min)
        .map(({ suggester, cell }) => ({
            name: suggester,
            average: cell.sum / cell.count,
            count: cell.count,
        }))
        .sort((a, b) => b.average - a.average || b.count - a.count);

export { average };
