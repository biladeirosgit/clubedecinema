import {
    affinity,
    affinityPairs,
    MIN_SHARED,
    ratingDistribution,
    genreRanking,
    genreCounts,
    creditCounts,
    creditRanking,
    franchiseMembers,
    franchiseNeighbours,
    franchiseRanking,
    unratedByUser,
    averageExcluding,
    suggesterRanking,
    suggesterAudience,
    suggesterYears,
    ratingSpread,
    misunderstoodChoices,
    ratingOdiousness,
    movieAudience,
    commenterRanking,
    decadeStats,
    runtimeStats,
    ownChoiceBias,
    MIN_OWN_CHOICES,
    ratersOfSuggester,
    suggestersRatedBy,
} from './utils/stats';

// As estatisticas novas cruzam quem escolheu o filme com quem lhe deu nota.
// O que se parte facil aqui e a regra de exclusao: a nota de quem escolhe nao
// conta para a media da escolha dele, mas um filme que so ele viu tambem nao
// pode contar como 0 e afundar-lhe a media.

const movie = (chosenBy, reviews, genres = ['Drama']) => ({
    title: 'Filme',
    year: 2000,
    link: 'https://letterboxd.com/film/filme/',
    date: '01/01/2020',
    chosenBy,
    genres,
    minutes: 100,
    reviews,
    comments: {},
});

describe('affinity', () => {
    // Os cenarios usam 8 filmes, acima do minimo, e o caso do minimo deriva
    // do proprio MIN_SHARED para o teste nao partir se ele mudar.
    const pairData = (as, bs) => Object.fromEntries(
        as.map((a, i) => [`f${i}`, movie(['S'], { A: a, B: bs[i] })])
    );

    const subidas = [1, 2, 2.5, 3, 3.5, 4, 4.5, 5];

    test('quem avalia sempre 1 ponto abaixo esta em sintonia perfeita', () => {
        const criticos = pairData(subidas, subidas.map((r) => r - 1));
        const res = affinity(criticos, 'A', 'B');
        expect(res.r).toBeCloseTo(1, 10);
        expect(res.bias).toBeCloseTo(1, 10); // o A da 1 estrela a mais
        expect(res.agree).toBe(0);           // e nunca concordam a menos de meia
    });

    test('gosto invertido da correlacao negativa', () => {
        const res = affinity(pairData(subidas, subidas.slice().reverse()), 'A', 'B');
        expect(res.r).toBeLessThan(0);
    });

    test('desvios maiores pesam mais que desvios pequenos', () => {
        const perto = affinity(pairData(subidas, subidas.map((r, i) => r + (i % 2 ? 0.5 : -0.5))), 'A', 'B');
        const longe = affinity(pairData(subidas, subidas.map((r, i) => r + (i % 2 ? 2 : -2))), 'A', 'B');
        expect(perto.r).toBeGreaterThan(longe.r);
    });

    test('o score encolhe para 0 quanto menos filmes houver', () => {
        const oito = affinity(pairData(subidas, subidas), 'A', 'B');
        const dezasseis = affinity(pairData([...subidas, ...subidas], [...subidas, ...subidas]), 'A', 'B');
        expect(oito.r).toBeCloseTo(1, 10);
        expect(dezasseis.r).toBeCloseTo(1, 10);
        expect(oito.score).toBeCloseTo(8 / 18, 10);
        expect(dezasseis.score).toBeCloseTo(16 / 26, 10);
        expect(dezasseis.score).toBeGreaterThan(oito.score);
    });

    test('null com poucos filmes em comum ou sem variacao nas notas', () => {
        const poucos = pairData(subidas.slice(0, MIN_SHARED - 1), subidas.slice(0, MIN_SHARED - 1));
        expect(affinity(poucos, 'A', 'B')).toBeNull();
        const sempreIgual = pairData(subidas, subidas.map(() => 4));
        expect(affinity(sempreIgual, 'A', 'B')).toBeNull();
    });

    test('affinityPairs ordena do mais em sintonia para o mais oposto', () => {
        const data = {};
        subidas.forEach((r, i) => {
            data[`f${i}`] = movie(['S'], { A: r, Igual: r, Oposto: 6 - r });
        });
        const pares = affinityPairs(data);
        expect(pares[0].score).toBeGreaterThan(0);
        expect(pares[pares.length - 1].score).toBeLessThan(0);
    });
});

describe('ratingDistribution', () => {
    const data = {
        a: movie(['X'], { A: 5, B: 2.5 }),
        b: movie(['X'], { A: 5, B: 1 }),
        c: movie(['X'], {}),
    };

    // Indexado pelo dobro da nota para as meias estrelas caberem em chaves
    // inteiras: 2.5 estrelas -> 5.
    test('conta as notas do clube todo pelo dobro da nota', () => {
        expect(ratingDistribution(data)).toEqual({ 10: 2, 5: 1, 2: 1 });
    });

    test('com nome conta so as notas dessa pessoa', () => {
        expect(ratingDistribution(data, 'A')).toEqual({ 10: 2 });
        expect(ratingDistribution(data, 'B')).toEqual({ 5: 1, 2: 1 });
    });

    test('quem nao avaliou nada devolve objeto vazio', () => {
        expect(ratingDistribution(data, 'NaoExiste')).toEqual({});
    });
});

describe('sagas', () => {
    const saga = (year, franchise, reviews, extra = {}) => ({
        ...movie(['A'], reviews),
        year,
        franchise,
        ...extra,
    });

    // Sem franchiseOrder ordena-se pelo ano de estreia.
    const jw = {
        jw1: saga(2014, 'John Wick', { X: 4 }),
        jw3: saga(2019, 'John Wick', { X: 2 }),
        jw2: saga(2017, 'John Wick', { X: 3 }),
        solo: saga(2017, 'Blade Runner', { X: 5 }),
        nada: saga(2000, null, { X: 5 }),
    };

    test('membros saem por ordem de estreia', () => {
        expect(franchiseMembers(jw, 'John Wick').map((m) => m.slug)).toEqual(['jw1', 'jw2', 'jw3']);
    });

    // O franchiseOrder vem do franchises.json e existe precisamente para os
    // casos em que a ordem da historia nao e a de estreia.
    test('franchiseOrder manda sobre o ano', () => {
        const data = {
            antigo: saga(2001, 'S', { X: 4 }, { franchiseOrder: 1 }),
            novo: saga(2002, 'S', { X: 4 }, { franchiseOrder: 0 }),
        };
        expect(franchiseMembers(data, 'S').map((m) => m.slug)).toEqual(['novo', 'antigo']);
    });

    test('as pontas da saga nao tem vizinho de um dos lados', () => {
        expect(franchiseNeighbours(jw, 'jw1').prequel).toBeNull();
        expect(franchiseNeighbours(jw, 'jw1').sequel.slug).toBe('jw2');
        expect(franchiseNeighbours(jw, 'jw3').sequel).toBeNull();
        expect(franchiseNeighbours(jw, 'jw2')).toEqual({
            prequel: expect.objectContaining({ slug: 'jw1' }),
            sequel: expect.objectContaining({ slug: 'jw3' }),
        });
    });

    // Um filme sozinho na saga (ex: Blade Runner 2049 sem o de 1982) nao pode
    // mostrar seccao nenhuma no card.
    test('filme sozinho na saga e filme sem saga nao tem vizinhos', () => {
        expect(franchiseNeighbours(jw, 'solo')).toEqual({ prequel: null, sequel: null });
        expect(franchiseNeighbours(jw, 'nada')).toEqual({ prequel: null, sequel: null });
        expect(franchiseNeighbours(jw, 'naoexiste')).toEqual({ prequel: null, sequel: null });
    });

    test('o ranking exige ligacao de 2 filmes', () => {
        expect(franchiseRanking(jw)).toMatchObject([{ name: 'John Wick', average: 3, count: 3 }]);
    });

    // A lista alimenta a bolha de hover do card das sagas: ordem da saga, nao da nota.
    test('o ranking traz os filmes da saga por ordem de estreia', () => {
        expect(franchiseRanking(jw)[0].movies.map((m) => m.slug)).toEqual(['jw1', 'jw2', 'jw3']);
    });

    // A capa de cada filme mostra quem o trouxe, portanto o chosenBy tem de
    // viajar com o filme dentro da saga.
    test('cada filme da saga leva quem o escolheu', () => {
        const data = {
            b: { ...saga(2002, 'S', { X: 4 }), chosenBy: ['Ana'] },
            a: { ...saga(2000, 'S', { X: 4 }), chosenBy: ['Rui', 'Ana'] },
        };
        expect(franchiseRanking(data)[0].movies.map((m) => m.chosenBy)).toEqual([
            ['Rui', 'Ana'],
            ['Ana'],
        ]);
    });

    test('filmes sem notas nao entram na media da saga', () => {
        const data = {
            a: saga(2000, 'S', { X: 4 }),
            b: saga(2001, 'S', { X: 2 }),
            c: saga(2002, 'S', {}),
        };
        expect(franchiseRanking(data)).toMatchObject([{ name: 'S', average: 3, count: 2 }]);
        expect(franchiseRanking(data)[0].movies.map((m) => m.slug)).toEqual(['a', 'b']); // o sem nota fica de fora
    });
});

describe('creditCounts / creditRanking', () => {
    const filme = (chosenBy, reviews, extra) => ({ ...movie(chosenBy, reviews), ...extra });

    const data = {
        a: filme(['A'], { X: 5, Y: 3 }, { directors: ['Coen', 'Coen 2'], cast: ['Bardem'] }),
        b: filme(['A'], { X: 3 }, { directors: ['Coen'], cast: ['Bardem', 'Jones'] }),
        c: filme(['B'], { X: 1 }, { directors: ['Lynch'], cast: ['Bardem'] }),
    };

    test('conta os valores de qualquer campo-lista', () => {
        expect(creditCounts(data, 'directors')).toEqual([
            { name: 'Coen', count: 2 },
            { name: 'Coen 2', count: 1 },
            { name: 'Lynch', count: 1 },
        ]);
        expect(creditCounts(data, 'cast')[0]).toEqual({ name: 'Bardem', count: 3 });
    });

    // Um filme co-realizado tem de contar para os dois nomes, nao so para o
    // primeiro — era exactamente aqui que o site antigo se enganava.
    test('todos os realizadores de um filme contam', () => {
        expect(creditCounts({ a: data.a }, 'directors').map((p) => p.name)).toEqual(['Coen', 'Coen 2']);
    });

    test('com nome, o counts filtra pelo que a pessoa escolheu', () => {
        expect(creditCounts(data, 'directors', 'B')).toEqual([{ name: 'Lynch', count: 1 }]);
    });

    // Um filme sem o campo (ex: creditos ainda por preencher) nao pode rebentar.
    test('campo em falta e ignorado', () => {
        const semCampo = { a: movie(['A'], { X: 4 }) };
        expect(creditCounts(semCampo, 'directors')).toEqual([]);
        expect(creditRanking(semCampo, 'directors', null, 1)).toEqual([]);
    });

    test('ranking usa a media do clube e respeita o minimo', () => {
        // Coen: filme a (media 4) e filme b (media 3) -> 3.5 em 2 filmes.
        expect(creditRanking(data, 'directors', null, 2)).toMatchObject([
            { name: 'Coen', average: 3.5, count: 2 },
        ]);
    });

    // A lista de filmes alimenta a bolha de hover dos realizadores/atores.
    test('traz os filmes que sustentam a media, do melhor para o pior', () => {
        const data = {
            bom: { ...movie(['X'], { A: 5 }), title: 'Bom', directors: ['Coen'] },
            mau: { ...movie(['X'], { A: 1 }), title: 'Mau', directors: ['Coen'] },
        };
        const [coen] = creditRanking(data, 'directors', null, 2);
        expect(coen.movies.map((m) => [m.slug, m.title, m.rating])).toEqual([
            ['bom', 'Bom', 5],
            ['mau', 'Mau', 1],
        ]);
    });

    // O counts fala do que a pessoa escolheu, o ranking do que ela viu — o B
    // avaliou filmes que nao escolheu e eles contam para a media dele.
    test('com nome, o ranking usa as notas dessa pessoa em tudo o que viu', () => {
        expect(creditRanking(data, 'cast', 'X', 3)).toMatchObject([
            { name: 'Bardem', average: 3, count: 3 },
        ]);
    });
});

describe('genreCounts', () => {
    const data = {
        a: movie(['A'], { X: 4 }, ['Terror', 'Comédia']),
        b: movie(['A'], { X: 4 }, ['Terror']),
        c: movie(['B'], { X: 4 }, ['Drama']),
    };

    test('sem nome conta o catalogo todo', () => {
        expect(genreCounts(data)).toEqual([
            { name: 'Terror', count: 2 },
            { name: 'Comédia', count: 1 },
            { name: 'Drama', count: 1 },
        ]);
    });

    // O card no perfil e sobre o que a pessoa traz ao clube, nao sobre o que ve.
    test('com nome conta so os filmes que essa pessoa escolheu', () => {
        expect(genreCounts(data, 'A')).toEqual([
            { name: 'Terror', count: 2 },
            { name: 'Comédia', count: 1 },
        ]);
    });

    test('filme co-escolhido conta para os dois', () => {
        const juntos = { a: movie(['A', 'B'], {}, ['Musical']) };
        expect(genreCounts(juntos, 'A')).toEqual([{ name: 'Musical', count: 1 }]);
        expect(genreCounts(juntos, 'B')).toEqual([{ name: 'Musical', count: 1 }]);
    });

    test('quem nunca escolheu nada devolve lista vazia', () => {
        expect(genreCounts(data, 'X')).toEqual([]);
    });
});

describe('genreRanking', () => {
    // Sem nome: media do clube em cada filme. Um filme com muita gente a votar
    // nao pode pesar mais do que um com pouca — cada filme conta uma vez.
    test('sem nome usa a media do clube, um voto por filme', () => {
        const data = {
            a: movie(['X'], { A: 5, B: 5, C: 5 }, ['Terror']),
            b: movie(['X'], { A: 1 }, ['Terror']),
            c: movie(['X'], { A: 3 }, ['Terror']),
        };
        expect(genreRanking(data, null, 3)).toMatchObject([{ name: 'Terror', average: 3, count: 3 }]);
    });

    test('com nome usa so as notas dessa pessoa', () => {
        const data = {
            a: movie(['X'], { A: 5, B: 1 }, ['Terror']),
            b: movie(['X'], { A: 5, B: 1 }, ['Terror']),
            c: movie(['X'], { A: 5, B: 1 }, ['Terror']),
        };
        expect(genreRanking(data, 'A', 3)[0].average).toBe(5);
        expect(genreRanking(data, 'B', 3)[0].average).toBe(1);
    });

    // Um filme com varios generos conta para todos eles.
    test('um filme conta para cada genero que tem', () => {
        const data = { a: movie(['X'], { A: 4 }, ['Terror', 'Comédia']) };
        expect(genreRanking(data, null, 1).map((g) => g.name).sort()).toEqual(['Comédia', 'Terror']);
    });

    // Um unico filme de 5 estrelas nao pode pôr o genero no topo do ranking.
    test('generos com poucos filmes ficam de fora', () => {
        const data = {
            raro: movie(['X'], { A: 5 }, ['Musical']),
            d1: movie(['X'], { A: 3 }),
            d2: movie(['X'], { A: 3 }),
            d3: movie(['X'], { A: 3 }),
        };
        expect(genreRanking(data, null, 3).map((g) => g.name)).toEqual(['Drama']);
    });

    // Filmes que a pessoa nao viu (ou que ninguem viu) nao entram na contagem.
    test('salta os filmes sem nota, sem NaN', () => {
        const data = {
            vazio: movie(['X'], {}, ['Terror']),
            visto: movie(['X'], { A: 4 }, ['Terror']),
        };
        const [terror] = genreRanking(data, null, 1);
        expect(terror).toMatchObject({ name: 'Terror', average: 4, count: 1 });
        expect(terror.movies.map((m) => m.slug)).toEqual(['visto']); // o sem nota nao entra
    });
});

describe('unratedByUser', () => {
    // A lista no perfil e curta (10), portanto a ordem decide o que aparece:
    // primeiro os melhores do clube, para servir de recomendacao.
    test('ordena pela media do clube, do melhor para o pior', () => {
        const data = {
            mau: movie(['X'], { B: 1 }),
            bom: movie(['X'], { B: 5 }),
            medio: movie(['X'], { B: 3 }),
        };
        expect(unratedByUser(data, 'A')).toEqual(['bom', 'medio', 'mau']);
    });

    // Sem notas nenhumas nao ha nada a recomendar — vai para o fim em vez de
    // aparecer no topo como se fosse 0.
    test('filmes que ninguem avaliou ficam no fim', () => {
        const data = {
            vazio: movie(['X'], {}),
            mau: movie(['X'], { B: 1 }),
        };
        expect(unratedByUser(data, 'A')).toEqual(['mau', 'vazio']);
    });

    test('nao inclui os filmes que o membro ja avaliou', () => {
        const data = { visto: movie(['X'], { A: 4 }), porVer: movie(['X'], { B: 4 }) };
        expect(unratedByUser(data, 'A')).toEqual(['porVer']);
    });
});

describe('averageExcluding', () => {
    test('sem notas nenhumas devolve null', () => {
        expect(averageExcluding(movie(['A'], {}), ['A'])).toBeNull();
    });

    // Nao pode devolver 0 nem NaN: quem chama distingue "ninguem avaliou" de
    // "avaliaram mal" por este null.
    test('so com a nota do proprio devolve null', () => {
        expect(averageExcluding(movie(['A'], { A: 5 }), ['A'])).toBeNull();
    });

    test('ignora os nomes excluidos e faz media do resto', () => {
        expect(averageExcluding(movie(['A'], { A: 5, B: 3, C: 1 }), ['A'])).toBe(2);
    });
});

describe('suggesterRanking', () => {
    // minMovies = 0 na maioria dos testes para isolar as contas do minimo.
    test('um filme so auto-avaliado nao conta nem puxa a media para baixo', () => {
        const data = {
            'so-ele': movie(['A'], { A: 5 }),
            outro: movie(['A'], { A: 1, B: 4 }),
        };
        const [a] = suggesterRanking(data, 0);
        expect(a).toEqual({ name: 'A', average: 4, count: 1 });
    });

    test('filme sem reviews nenhumas e saltado, sem NaN', () => {
        const data = {
            vazio: movie(['A'], {}),
            outro: movie(['A'], { B: 3 }),
        };
        const [a] = suggesterRanking(data, 0);
        expect(a.count).toBe(1);
        expect(Number.isNaN(a.average)).toBe(false);
    });

    // Num filme co-escolhido tem de sair a nota dos dois, nao so a do primeiro.
    test('filme co-escolhido conta para os dois e exclui os dois', () => {
        const data = { juntos: movie(['A', 'B'], { A: 5, B: 5, C: 3 }) };
        expect(suggesterRanking(data, 0)).toEqual([
            { name: 'A', average: 3, count: 1 },
            { name: 'B', average: 3, count: 1 },
        ]);
    });

    test('a fronteira do minimo: 4 fica de fora, 5 entra', () => {
        const four = {};
        for (let i = 0; i < 4; i += 1) four[`f${i}`] = movie(['A'], { B: 4 });
        expect(suggesterRanking(four, 5)).toEqual([]);

        const five = { ...four, f4: movie(['A'], { B: 4 }) };
        expect(suggesterRanking(five, 5).map((s) => s.name)).toEqual(['A']);
    });

    // Os filmes saltados tambem nao contam para o minimo — quem escolheu 6 mas
    // so teve 4 vistos por outros nao chega ao ranking.
    test('filmes saltados nao contam para o minimo', () => {
        const data = {};
        for (let i = 0; i < 4; i += 1) data[`visto${i}`] = movie(['A'], { B: 4 });
        data.soEle1 = movie(['A'], { A: 5 });
        data.soEle2 = movie(['A'], { A: 5 });
        expect(suggesterRanking(data, 0)[0].count).toBe(4);
        expect(suggesterRanking(data, 5)).toEqual([]);
    });

    test('ordena da melhor media para a pior', () => {
        const data = {
            mau: movie(['A'], { C: 1 }),
            bom: movie(['B'], { C: 5 }),
        };
        expect(suggesterRanking(data, 0).map((s) => s.name)).toEqual(['B', 'A']);
    });
});

describe('suggesterAudience', () => {
    test('media de pessoas que viram cada escolha', () => {
        const data = {
            a: movie(['A'], { X: 4, Y: 4, Z: 4 }),
            b: movie(['A'], { X: 4 }),
        };
        expect(suggesterAudience(data, 0)).toEqual([{ name: 'A', average: 2, count: 2 }]);
    });

    // Ao contrario do ranking de notas, aqui "ninguem viu" e a propria medida —
    // tem de contar como 0 em vez de o filme desaparecer da conta.
    test('um filme que ninguem viu conta como 0', () => {
        const data = {
            a: movie(['A'], { X: 4, Y: 4 }),
            b: movie(['A'], {}),
        };
        expect(suggesterAudience(data, 0)).toEqual([{ name: 'A', average: 1, count: 2 }]);
    });

    test('filme co-escolhido conta para os dois', () => {
        const data = { a: movie(['A', 'B'], { X: 4, Y: 4 }) };
        expect(suggesterAudience(data, 0)).toEqual([
            { name: 'A', average: 2, count: 1 },
            { name: 'B', average: 2, count: 1 },
        ]);
    });

    test('respeita o minimo de escolhas', () => {
        const data = { a: movie(['A'], { X: 4 }), b: movie(['A'], { X: 4 }) };
        expect(suggesterAudience(data, 3)).toEqual([]);
        expect(suggesterAudience(data, 2)).toHaveLength(1);
    });

    test('ordena de quem enche mais a sala para quem enche menos', () => {
        const data = {
            a: movie(['A'], { X: 4 }),
            b: movie(['B'], { X: 4, Y: 4, Z: 4 }),
        };
        expect(suggesterAudience(data, 0).map((s) => s.name)).toEqual(['B', 'A']);
    });
});

describe('suggesterYears', () => {
    const dated = (chosenBy, year) => ({ ...movie(chosenBy, { X: 4 }), year });

    test('media do ano de estreia, do mais antigo para o mais recente', () => {
        const data = {
            a: dated(['Velho'], 1970),
            b: dated(['Velho'], 1990),
            c: dated(['Novo'], 2020),
        };
        expect(suggesterYears(data, 0)).toEqual([
            { name: 'Velho', average: 1980, count: 2 },
            { name: 'Novo', average: 2020, count: 1 },
        ]);
    });

    test('filme co-escolhido conta para os dois', () => {
        const data = { a: dated(['A', 'B'], 2000) };
        expect(suggesterYears(data, 0).map((s) => s.name).sort()).toEqual(['A', 'B']);
    });

    test('filme sem ano nao entra na media', () => {
        const data = { a: dated(['A'], 1980), b: dated(['A'], undefined) };
        expect(suggesterYears(data, 0)).toEqual([{ name: 'A', average: 1980, count: 1 }]);
    });

    test('respeita o minimo de escolhas', () => {
        const data = { a: dated(['A'], 1980), b: dated(['A'], 1990) };
        expect(suggesterYears(data, 3)).toEqual([]);
        expect(suggesterYears(data, 2).map((s) => s.name)).toEqual(['A']);
    });
});

describe('ratingSpread', () => {
    test('do mais divisivo para o mais consensual', () => {
        const data = {
            divisivo: movie(['X'], { A: 1, B: 5, C: 1, D: 5, E: 3 }),
            consenso: movie(['X'], { A: 3, B: 3, C: 3, D: 3, E: 3 }),
        };
        const [first, second] = ratingSpread(data, 5);
        expect(first.slug).toBe('divisivo');
        expect(second.slug).toBe('consenso');
        expect(second.spread).toBe(0);
        expect(first.average).toBe(3);
        expect(first.count).toBe(5);
    });

    test('filme com poucas notas nao entra', () => {
        const data = { a: movie(['X'], { A: 1, B: 5 }) };
        expect(ratingSpread(data, 5)).toEqual([]);
        expect(ratingSpread(data, 2)).toHaveLength(1);
    });
});

describe('misunderstoodChoices', () => {
    const escolha = (chosenBy, reviews) => ({ ...movie(chosenBy, reviews), title: 'Filme' });

    test('do mais incompreendido para o menos', () => {
        const data = {
            adorou: escolha(['Eu'], { Eu: 5, A: 1, B: 1, C: 1, D: 1 }),
            normal: escolha(['Eu'], { Eu: 3, A: 3, B: 3, C: 3, D: 3 }),
        };
        const [primeiro, segundo] = misunderstoodChoices(data);
        expect(primeiro.slug).toBe('adorou');
        expect(primeiro.gap).toBe(4);
        expect(primeiro.own).toBe(5);
        expect(primeiro.others).toBe(1);
        expect(primeiro.count).toBe(4);
        expect(segundo.gap).toBe(0);
    });

    // Escolha a meias: os dois donos formam um lado e nenhum deles polui o outro.
    test('escolha a meias junta os dois donos e tira-os dos outros', () => {
        const data = { a: escolha(['Eu', 'Tu'], { Eu: 5, Tu: 4, A: 1, B: 1, C: 1, D: 1 }) };
        const [res] = misunderstoodChoices(data);
        expect(res.own).toBe(4.5);
        expect(res.others).toBe(1);
        expect(res.count).toBe(4);
    });

    test('precisa de notas de quem nao escolheu, e de nota do proprio', () => {
        const poucos = { a: escolha(['Eu'], { Eu: 5, A: 1, B: 1, C: 1 }) };
        expect(misunderstoodChoices(poucos)).toEqual([]);
        expect(misunderstoodChoices(poucos, 3)).toHaveLength(1);

        const semNotaDoDono = { a: escolha(['Eu'], { A: 1, B: 1, C: 1, D: 1 }) };
        expect(misunderstoodChoices(semNotaDoDono)).toEqual([]);
    });
});

describe('ratingOdiousness', () => {
    const filme = (notas) => movie(['S'], notas);
    const oito = (fn) => Object.fromEntries(
        Array.from({ length: 8 }, (_, i) => [`f${i}`, filme(fn(i))])
    );

    // O ponto da metrica: quem da sempre uma estrela abaixo nao e odioso, e so
    // a escala dele. Tirado o vies nao lhe sobra desvio nenhum, portanto nem
    // chega a entrar na lista.
    test('quem da sempre abaixo por igual nao e odioso', () => {
        const data = oito(() => ({ Duro: 2, A: 3, B: 3, C: 3, D: 3 }));
        expect(ratingOdiousness(data).map((o) => o.name)).not.toContain('Duro');
    });

    // O mesmo perfil de desvio em cima ou em baixo da a mesma odiosidade: e o
    // vies que os separa, e o vies sai da conta.
    test('o vies sai da conta: mesmo desvio, mesma odiosidade', () => {
        const duro = oito((i) => ({ Duro: i === 0 ? 1 : 2, A: 3, B: 3, C: 3, D: 3 }));
        const brando = oito((i) => ({ Brando: i === 0 ? 3 : 4, A: 3, B: 3, C: 3, D: 3 }));
        const [d] = ratingOdiousness(duro);
        const [b] = ratingOdiousness(brando);
        expect(d.bias).toBeLessThan(0);
        expect(b.bias).toBeGreaterThan(0);
        expect(d.average).toBeCloseTo(b.average, 10);
    });

    // E o inverso: quem costuma concordar mas afunda um filme fica no topo,
    // mesmo tendo media mais alta que o duro do teste anterior.
    test('afundar um filme fora do habitual e que conta', () => {
        const data = {
            ...oito(() => ({ Normal: 3, Duro: 2, A: 3, B: 3, C: 3, D: 3 })),
            nuke: filme({ Normal: 0.5, Duro: 2, A: 3, B: 3, C: 3, D: 3 }),
        };
        const res = ratingOdiousness(data);
        expect(res[0].name).toBe('Normal');
        expect(res[0].average).toBeLessThan(-1);
        const duro = res.find((o) => o.name === 'Duro');
        expect(duro.average).toBeGreaterThan(res[0].average); // menos odioso que o Normal
    });

    test('guarda o veredicto mais odioso e conta os filmes abaixo', () => {
        const data = {
            ...oito(() => ({ X: 3, A: 3, B: 3, C: 3, D: 3 })),
            odiado: { ...filme({ X: 0.5, A: 5, B: 5, C: 5, D: 5 }), title: 'Odiado' },
        };
        const [x] = ratingOdiousness(data).filter((o) => o.name === 'X');
        expect(x.worst.title).toBe('Odiado');
        expect(x.worst.own).toBe(0.5);
        expect(x.worst.others).toBe(5);
        expect(x.rated).toBe(9);
    });

    test('respeita os minimos de filmes e de outros avaliadores', () => {
        const poucosFilmes = { a: filme({ X: 1, A: 3, B: 3, C: 3, D: 3 }) };
        expect(ratingOdiousness(poucosFilmes)).toEqual([]);

        const poucosOutros = oito(() => ({ X: 1, A: 3, B: 3 })); // so 2 outros
        expect(ratingOdiousness(poucosOutros, 1)).toEqual([]);
    });
});

describe('movieAudience', () => {
    test('do mais visto para o menos, e zero conta', () => {
        const data = {
            cheio: movie(['X'], { A: 4, B: 4, C: 4 }),
            vazio: movie(['X'], {}),
            meio: movie(['X'], { A: 4 }),
        };
        expect(movieAudience(data).map((m) => [m.slug, m.count])).toEqual([
            ['cheio', 3],
            ['meio', 1],
            ['vazio', 0],
        ]);
    });
});

describe('commenterRanking', () => {
    const comented = (reviews, comments) => ({ ...movie(['X'], reviews), comments });

    // Um comentario por pessoa e por filme: varias linhas no mesmo texto
    // continuam a ser um filme comentado, nao dois.
    test('conta filmes comentados e a fatia dos filmes vistos', () => {
        const data = {
            a: comented({ A: 4, B: 4 }, { A: 'um\ndois', B: 'um' }),
            b: comented({ A: 4 }, { A: 'tres' }),
        };
        expect(commenterRanking(data)).toEqual([
            { name: 'A', count: 2, watched: 2, rate: 1 },
            { name: 'B', count: 1, watched: 1, rate: 1 }, // so viu o filme a
        ]);
    });

    test('comentario vazio ou so espacos nao conta', () => {
        const data = { a: comented({ A: 4, B: 4, C: 4 }, { A: 'ola', B: '', C: '   ' }) };
        expect(commenterRanking(data).map((c) => c.name)).toEqual(['A']);
    });

    test('quem nunca comentou fica de fora', () => {
        const data = { a: comented({ A: 4, Calado: 4 }, { A: 'ola' }) };
        expect(commenterRanking(data).map((c) => c.name)).toEqual(['A']);
    });
});

describe('decadeStats', () => {
    const fromYear = (year, reviews = { X: 4 }) => ({ ...movie(['S'], reviews), year });

    test('agrupa por decada, da mais antiga para a mais recente', () => {
        const data = {
            a: fromYear(1994, { X: 5 }),
            b: fromYear(1999, { X: 3 }),
            c: fromYear(2001, { X: 4 }),
        };
        expect(decadeStats(data)).toEqual([
            { decade: 1990, count: 2, average: 4 },
            { decade: 2000, count: 1, average: 4 },
        ]);
    });

    test('decada sem nenhuma nota conta o filme mas fica sem media', () => {
        expect(decadeStats({ a: fromYear(1985, {}) })).toEqual([
            { decade: 1980, count: 1, average: null },
        ]);
    });

    // O perfil: so os filmes dessa pessoa, com a media das notas dela.
    test('com nome conta so o que a pessoa avaliou, com a nota dela', () => {
        const data = {
            a: fromYear(1994, { X: 5, Y: 1 }),
            b: fromYear(1999, { Y: 3 }),
            c: fromYear(2001, { X: 2 }),
        };
        expect(decadeStats(data, 'X')).toEqual([
            { decade: 1990, count: 1, average: 5 },
            { decade: 2000, count: 1, average: 2 },
        ]);
    });
});

describe('runtimeStats', () => {
    const comMinutos = (minutes, reviews = { X: 4 }) => ({ ...movie(['S'], reviews), minutes });

    test('agrupa por escalao, sempre pela ordem dos escaloes', () => {
        const data = {
            curto: comMinutos(89, { X: 5 }),
            medio: comMinutos(90, { X: 3 }),
            longo: comMinutos(200, { X: 1 }),
        };
        expect(runtimeStats(data)).toEqual([
            { label: '< 90 min', count: 1, average: 5 },
            { label: '90–110', count: 1, average: 3 },
            { label: '110–130', count: 0, average: null },
            { label: '130–150', count: 0, average: null },
            { label: '150+ min', count: 1, average: 1 },
        ]);
    });

    // O `max` e exclusivo: 90 minutos cai no escalao seguinte, nao no primeiro.
    test('a fronteira do escalao pertence ao escalao de cima', () => {
        const [primeiro, segundo] = runtimeStats({ a: comMinutos(90) });
        expect(primeiro.count).toBe(0);
        expect(segundo.count).toBe(1);
    });

    test('filme sem duracao nao entra em escalao nenhum', () => {
        const semMinutos = { ...movie(['S'], { X: 4 }), minutes: 0 };
        expect(runtimeStats({ a: semMinutos }).every((b) => b.count === 0)).toBe(true);
    });

    test('com nome conta so o que a pessoa avaliou, com a nota dela', () => {
        const data = {
            a: comMinutos(80, { X: 5, Y: 1 }),
            b: comMinutos(80, { Y: 3 }),
        };
        const [primeiro] = runtimeStats(data, 'X');
        expect(primeiro).toMatchObject({ count: 1, average: 5 });
        expect(runtimeStats(data, 'Ninguem').every((b) => b.count === 0)).toBe(true);
    });
});

describe('ownChoiceBias', () => {
    test('compara a nota do proprio com a media dos outros no mesmo filme', () => {
        // Da 5 onde os outros dao 3 -> +2, e 4 onde os outros dao 4 -> 0.
        const data = {
            a: movie(['Eu'], { Eu: 5, A: 3, B: 3 }),
            b: movie(['Eu'], { Eu: 4, A: 4, B: 4 }),
            c: movie(['Eu'], { Eu: 2, A: 4, B: 4 }),
        };
        expect(ownChoiceBias(data, 3)).toEqual([{ name: 'Eu', average: 0, count: 3 }]);
    });

    test('a nota de quem co-escolheu fica de fora da media dos outros', () => {
        const data = {
            a: movie(['Eu', 'Tu'], { Eu: 5, Tu: 5, Outro: 3 }),
            b: movie(['Eu', 'Tu'], { Eu: 5, Tu: 5, Outro: 3 }),
            c: movie(['Eu', 'Tu'], { Eu: 5, Tu: 5, Outro: 3 }),
        };
        // Se o Tu contasse como "outro", a diferenca do Eu era menor que 2.
        expect(ownChoiceBias(data, 3).map((x) => [x.name, x.average])).toEqual([
            ['Eu', 2],
            ['Tu', 2],
        ]);
    });

    test('o minimo por omissao e o MIN_OWN_CHOICES', () => {
        const uma = { a: movie(['Eu'], { Eu: 5, A: 3 }) };
        expect(ownChoiceBias(uma)).toEqual([]); // 1 escolha nao chega
        expect(MIN_OWN_CHOICES).toBe(2);
    });

    test('escolha que so o proprio avaliou nao conta, e o minimo e respeitado', () => {
        const data = {
            a: movie(['Eu'], { Eu: 5 }),           // ninguem mais avaliou
            b: movie(['Eu'], { A: 3 }),            // escolheu mas nao avaliou
            c: movie(['Eu'], { Eu: 5, A: 3 }),
        };
        expect(ownChoiceBias(data, 2)).toEqual([]);
        expect(ownChoiceBias(data, 1)).toEqual([{ name: 'Eu', average: 2, count: 1 }]);
    });
});

describe('ratersOfSuggester', () => {
    const data = {
        m1: movie(['A'], { A: 5, B: 4, C: 1 }),
        m2: movie(['A'], { A: 5, B: 4, C: 2 }),
        m3: movie(['A'], { A: 5, B: 3, C: 3 }),
        m4: movie(['A'], { B: 5 }),
    };

    // Quem escolhe nao pode aparecer como fa das proprias escolhas.
    test('exclui o proprio mesmo com notas que cheguem', () => {
        expect(ratersOfSuggester(data, 'A').map((r) => r.name)).not.toContain('A');
    });

    test('ordena do maior fa ao maior hater', () => {
        expect(ratersOfSuggester(data, 'A')).toEqual([
            { name: 'B', average: 4, count: 4 },
            { name: 'C', average: 2, count: 3 },
        ]);
    });

    // Sem minimo: com um corte a 3 a lista ficava vazia para quase todos os
    // membros, que e precisamente o que se quer evitar aqui.
    test('basta ter avaliado uma escolha para aparecer', () => {
        const poucos = { m1: movie(['A'], { B: 4, D: 5 }), m2: movie(['A'], { B: 4 }) };
        expect(ratersOfSuggester(poucos, 'A')).toEqual([
            { name: 'D', average: 5, count: 1 },
            { name: 'B', average: 4, count: 2 },
        ]);
    });

    test('quem nunca escolheu nada devolve lista vazia', () => {
        expect(ratersOfSuggester(data, 'C')).toEqual([]);
    });
});

describe('suggestersRatedBy', () => {
    const data = {
        m1: movie(['A'], { A: 5, B: 2 }),
        m2: movie(['A'], { A: 5, B: 2 }),
        m3: movie(['A'], { A: 5, B: 2 }),
        m4: movie(['B'], { B: 4 }),
    };

    // Decisao de produto: neste ranking a pessoa aparece a si propria, para se
    // ver como se avalia comparada com os outros. Nao "corrigir".
    test('inclui o proprio quando avaliou 3 ou mais escolhas dele', () => {
        expect(suggestersRatedBy(data, 'A')).toEqual([{ name: 'A', average: 5, count: 3 }]);
    });

    test('corta quem tem menos de 3 filmes avaliados', () => {
        expect(suggestersRatedBy(data, 'B').map((s) => s.name)).toEqual(['A']);
    });

    test('ordena da melhor media para a pior', () => {
        const dois = {
            a1: movie(['A'], { X: 5 }),
            a2: movie(['A'], { X: 5 }),
            a3: movie(['A'], { X: 5 }),
            b1: movie(['B'], { X: 1 }),
            b2: movie(['B'], { X: 1 }),
            b3: movie(['B'], { X: 1 }),
        };
        expect(suggestersRatedBy(dois, 'X').map((s) => s.name)).toEqual(['A', 'B']);
    });
});
