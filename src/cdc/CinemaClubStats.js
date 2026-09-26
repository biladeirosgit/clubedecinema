// src/CinemaClubStats.js

import { cinemaData } from './movies'; // so filmes que ja chegaram — ver movies.js
import React from 'react';
import './CinemaClubStats.css';
import MovieRow from '../components/MovieRow';
import RankedBars from '../components/RankedBars';
import FranchiseShelf from './FranchiseShelf';
import { Link } from 'react-router-dom';
import { compareDatesDesc, hasWeekEnded } from '../utils/dates';
import Avatar from '../components/Avatar';
import InfoTip from '../components/InfoTip';
import { HoverAnchor, MovieLines } from '../components/HoverBubble';
import { affinityPairs, suggesterRanking, suggesterAudience, suggesterAverages, suggesterYears, genreRanking, creditRanking, franchiseRanking, ratingDistribution, ratingSpread, misunderstoodChoices, ratingOdiousness, movieAudience, commenterRanking, decadeStats, runtimeStats, ownChoiceBias, RATING_BUCKETS, MIN_SHARED, AFFINITY_SHRINK, MIN_RECOMMENDATIONS, MIN_OWN_CHOICES, MIN_OTHER_RATINGS, MIN_HARSHNESS_MOVIES, MIN_GENRE_MOVIES, MIN_CREDIT_MOVIES, MIN_DIRECTOR_MOVIES, MIN_FRANCHISE_MOVIES, MIN_SPREAD_RATINGS } from '../utils/stats';

const CinemaClubStats = () => {

    // Quem da notas mais altas, e quanto. E precisamente o que a correlacao
    // ignora -- escrever isto ao lado evita que o numero pareca sair do nada.
    const biasLabel = (pair) => {
        const gap = Math.abs(pair.bias);
        if (gap < 0.1) return 'dao notas igualmente generosas';
        const generoso = pair.bias > 0 ? pair.a : pair.b;
        return `o ${generoso} da +${gap.toFixed(1)}★ em media`;
    };

    // Função para calcular o total de minutos assistidos
    const calculateTotalMinutes = () => {
        let totalMinutes = 0;
        for (const [, movie] of Object.entries(cinemaData)) {
            totalMinutes += movie.minutes;
        }
        return totalMinutes;
    };

    // Função para calcular a média de minutos por filme
    const calculateAverageMinutes = () => {
        const totalMinutes = calculateTotalMinutes();
        const totalMovies = Object.keys(cinemaData).length;
        return totalMinutes / totalMovies;
    };

    // Função para encontrar todas as pessoas únicas que assistiram aos filmes
    const findUniqueViewers = () => {
        const viewers = new Set();
        for (const [, movie] of Object.entries(cinemaData)) {
            for (const viewer in movie.reviews) {
                viewers.add(viewer);
            }
        }
        return viewers.size;
    };

    // Função para calcular o total de pessoas que assistiram aos filmes
    const calculateTotalViewers = () => {
        let totalViewers = 0;
        for (const [, movie] of Object.entries(cinemaData)) {
            totalViewers += Object.keys(movie.reviews).length;
        }
        return totalViewers;
    };

    const calculateTotalMovies = () => {
        return Object.entries(cinemaData).length
    }

    const calculateTopWatchers = () => {
        var watchers = {}

        var movies = Object.entries(cinemaData).sort((a, b) => compareDatesDesc(a[1].date, b[1].date));

        // Streak e "membro ativo" so olham para semanas ja fechadas: enquanto a
        // semana do filme mais recente nao acabar, quem ainda nao o viu nao
        // deve perder o streak nem deixar de ser ativo por causa disso.
        const settled = movies.filter(([, movie]) => hasWeekEnded(movie.date));
        // Do mais recente para o mais antigo, um conjunto de quem viu cada um.
        const seenBy = settled.map(([, movie]) => new Set(Object.keys(movie.reviews)));

        const ensure = (user) => {
            if (!(user in watchers)) {
                watchers[user] = {
                    "total_movies" : 0,
                    "total_ratings" : 0,
                    "minutes" : 0,
                    "choices" : 0,
                    "streak" : 0,
                    "max_streak" : 0,
                    "active" : 0
                }
            }
            return watchers[user];
        }

        for (const [, movie] of movies) {
            for (const [user, rating] of Object.entries(movie.reviews)) {
                const watcher = ensure(user);
                watcher["total_movies"] += 1;
                watcher["total_ratings"] += rating;
                watcher["minutes"] += movie.minutes || 0;
            }

            for (const user of movie.chosenBy) {
                ensure(user)["choices"] += 1;
            }
        }

        for (const [user, watcher] of Object.entries(watchers)) {
            let run = 0;
            let longest = 0;
            let firstSeen = -1;

            seenBy.forEach((viewers, index) => {
                if (viewers.has(user)) {
                    if (firstSeen === -1) firstSeen = index;
                    run += 1;
                    if (run > longest) longest = run;
                }
                else {
                    run = 0;
                }
            });

            // Streak atual: positivo = filmes seguidos ate ao ultimo ja fechado,
            // negativo = quantos dos mais recentes falhou.
            if (firstSeen === 0) {
                let current = 0;
                while (current < seenBy.length && seenBy[current].has(user)) {
                    current += 1;
                }
                watcher["streak"] = current;
            }
            else if (firstSeen > 0) {
                watcher["streak"] = -firstSeen;
            }
            else {
                watcher["streak"] = 0;
            }

            watcher["max_streak"] = longest;
            watcher["active"] = seenBy.slice(0, 12).filter((viewers) => viewers.has(user)).length;
        }

        return watchers
    }

    // Filmes por media, do melhor para o pior. Quem ainda nao tem nota nenhuma
    // fica de fora: o filme da semana em curso nao pode ser o pior do clube so
    // porque ainda ninguem lhe deu nota (e a media dava NaN).
    const calculateTopMovies = () => {
        let movies = Object.entries(cinemaData)
            .map(([slug, movie]) => {
                var reviews = 0;
                var total_rating = 0;

                for (const [, rating] of Object.entries(movie.reviews)) {
                    reviews += 1;
                    total_rating += rating;
                }

                return {
                    slug,
                    reviews: reviews,
                    average: reviews ? (total_rating / reviews).toFixed(2) : null,
                };
            })
            .filter((m) => m.average !== null);

        movies.sort((a, b) => b.average - a.average);

        return movies;
    }

    function getTop10Viewers(data) {
        // Converte o objeto em um array de entradas [chave, valor]
        let entries = Object.entries(data);

        // Adiciona a média de avaliações para cada entrada
        entries = entries.map(([name, info]) => {
            var member_active = "No";
            if (info.active >= 4) {
                member_active = "Yes";
            }
            return {
                name,
                total_movies: info.total_movies,
                total_ratings: info.total_ratings,
                hours: Math.round(info.minutes / 60),
                comments: commentsByName[name] ? commentsByName[name].count : 0,
                choiceYear: eraByName[name] ? Math.round(eraByName[name].average) : null,
                choices: info.choices,
                streak: info.streak,
                max_streak: info.max_streak,
                active: member_active,
                active_count: info.active,
                average_ratings: (info.total_ratings / info.total_movies).toFixed(2)
            };
        });

        // Ordena o array pelo total de filmes, do maior para o menor
        entries.sort((a, b) => {
            if (b.total_movies === a.total_movies) {
              return a.name.localeCompare(b.name); // Ordena alfabeticamente pelo nome
            }
            return b.total_movies - a.total_movies; // Ordena por total de filmes
          });
        return entries;
    }

    // Sem corte nem minimo: aqui e a tabela toda, nao um top.
    const commentsByName = Object.fromEntries(commenterRanking(cinemaData).map((c) => [c.name, c]));
    const eraByName = Object.fromEntries(suggesterYears(cinemaData, 0).map((e) => [e.name, e]));

    const watchers = calculateTopWatchers()
    const top = getTop10Viewers(watchers)
    let active_members = 0;

    top.forEach(viewer => {
        if (viewer.active === 'Yes') {
            active_members+= 1;
        }
    })

    const topMovies = calculateTopMovies()

    const top10 = topMovies.slice(0, 10)
    const worst10 = topMovies.slice().reverse().slice(0, 10)

    const ratingStats = ratingDistribution(cinemaData);
    const maxRatingCount = Math.max(1, ...Object.values(ratingStats));
    const allPairs = affinityPairs(cinemaData);
    const topPairs = allPairs.slice(0, 10);
    // A cauda da mesma lista: os pares que menos vezes concordam.
    const worstPairs = allPairs.slice().reverse().slice(0, 10);
    const spread = ratingSpread(cinemaData);
    const mostDivisive = spread.slice(0, 10);
    const mostAgreed = spread.slice().reverse().slice(0, 10);
    const misunderstood = misunderstoodChoices(cinemaData).slice(0, 10);
    const odious = ratingOdiousness(cinemaData).slice(0, 10);
    const bestFranchises = franchiseRanking(cinemaData);
    const biggestCrowds = movieAudience(cinemaData).slice(0, 10);
    const topCommenters = commenterRanking(cinemaData).slice(0, 10);
    const decades = decadeStats(cinemaData);
    const maxDecadeCount = Math.max(1, ...decades.map((d) => d.count));
    const runtimes = runtimeStats(cinemaData);
    const maxRuntimeCount = Math.max(1, ...runtimes.map((r) => r.count));
    const selfLovers = ownChoiceBias(cinemaData).slice(0, 10);
    const topGenreRatings = genreRanking(cinemaData);
    const topThemeRatings = creditRanking(cinemaData, 'themes', null, MIN_GENRE_MOVIES);
    const bestDirectors = creditRanking(cinemaData, 'directors', null, MIN_DIRECTOR_MOVIES);
    const bestActors = creditRanking(cinemaData, 'cast', null, MIN_CREDIT_MOVIES);
    const bestSuggesters = suggesterRanking(cinemaData).slice(0, 10);
    const biggestAudience = suggesterAudience(cinemaData).slice(0, 10);
    const suggesterEras = suggesterYears(cinemaData).slice(0, 10);
    const suggesterAvg = suggesterAverages(cinemaData);

    return (
        <div className="stats-page">
            <div className='title-site'>
                <h1>Estatísticas do Clube</h1>
            </div>
            <div className="kpi-grid">
                <div className="kpi-tile">
                    <span className="kpi-value">{calculateTotalMovies()}</span>
                    <span className="kpi-label">Filmes recomendados</span>
                    <div className="kpi-sub">
                        <span className="kpi-sub-value">{calculateTotalViewers()}</span>
                        <span className="kpi-sub-label">Ratings dados</span>
                    </div>
                </div>
                <div className="kpi-tile">
                    <span className="kpi-value">{Math.round(calculateTotalMinutes() / 60).toLocaleString()}</span>
                    <span className="kpi-label">Horas de cinema</span>
                    <div className="kpi-sub">
                        <span className="kpi-sub-value">{calculateAverageMinutes().toFixed(0)}</span>
                        <span className="kpi-sub-label">Min / filme</span>
                    </div>
                </div>
                <div className="kpi-tile">
                    <span className="kpi-value">{findUniqueViewers()}</span>
                    <span className="kpi-label">Membros</span>
                    <div className="kpi-sub">
                        <span className="kpi-sub-value">{active_members}</span>
                        <span className="kpi-sub-label">Membros ativos</span>
                    </div>
                </div>
            </div>

            <div className="insight-grid">
                <div className="insight-card insight-card--third">
                    <h2>Distribuição de ratings<InfoTip>Quantas vezes o clube deu cada nota, de meia a cinco estrelas. Conta <b>notas</b> e não filmes: um filme com oito avaliações entra em oito barras.</InfoTip></h2>
                    <div className="rating-bars">
                        {RATING_BUCKETS.map((key) => {
                            const count = ratingStats[key] || 0;
                            return (
                                <div className="rating-bar-row" key={key}>
                                    <span className="rating-bar-label">{(key / 2).toFixed(1)}★</span>
                                    <div className="rating-bar-track">
                                        <div className="rating-bar-fill" style={{ width: `${(count / maxRatingCount) * 100}%` }} />
                                    </div>
                                    <span className="rating-bar-count">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="insight-card insight-card--third">
                    <h2>O clube por década<InfoTip>A barra é quantos filmes o clube viu de cada década de <i>estreia</i>; à direita vai <b>filmes · média</b>. A média é a das médias de cada filme, portanto cada filme pesa o mesmo, tenha sido visto por dez pessoas ou por duas. Ordem cronológica, não ranking — le-se como uma linha do tempo.</InfoTip></h2>
                    <div className="rating-bars">
                        {decades.map((d) => (
                            <div className="rating-bar-row" key={d.decade}>
                                <span className="rating-bar-label">{d.decade}s</span>
                                <div className="rating-bar-track">
                                    <div className="rating-bar-fill" style={{ width: `${(d.count / maxDecadeCount) * 100}%` }} />
                                </div>
                                <span className="rating-bar-count">{d.count} · {d.average != null ? d.average.toFixed(2) : '-'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="insight-card insight-card--third">
                    <h2>O clube por duração<InfoTip>A barra é quantos filmes há em cada escalão de duração; à direita vai <b>filmes · média</b>. A média é a das médias de cada filme, portanto cada filme pesa o mesmo. Por ordem de duração, não ranking.</InfoTip></h2>
                    <div className="rating-bars">
                        {runtimes.map((r) => (
                            <div className="rating-bar-row" key={r.label}>
                                <span className="rating-bar-label">{r.label}</span>
                                <div className="rating-bar-track">
                                    <div className="rating-bar-fill" style={{ width: `${(r.count / maxRuntimeCount) * 100}%` }} />
                                </div>
                                <span className="rating-bar-count">{r.count} · {r.average != null ? r.average.toFixed(2) : '-'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="insight-card insight-card--half">
                    <h2>Géneros mais bem avaliados<InfoTip>A barra é quantos filmes têm esse género; à direita vai <b>filmes · média</b>, e dá para ordenar pela média ou por quantos são. Um filme conta para todos os géneros que tem. A média é a das médias de cada filme, portanto cada filme pesa o mesmo, tenha sido visto por dez pessoas ou por duas. Só entram géneros com pelo menos {MIN_GENRE_MOVIES} filmes, senão um género com um filme só encabeçava a lista.</InfoTip></h2>
                    <RankedBars rows={topGenreRatings.map((g) => ({ key: g.name, label: g.name, count: g.count, average: g.average }))} />
                </div>

                <div className="insight-card insight-card--half">
                    <h2>Temas mais bem avaliados<InfoTip>O mesmo que os géneros, mas com os temas do Letterboxd, que são mais específicos. Um filme conta para todos os temas que tem, e só entram temas com pelo menos {MIN_GENRE_MOVIES} filmes.</InfoTip></h2>
                    <RankedBars rows={topThemeRatings.map((g) => ({ key: g.name, label: g.name, count: g.count, average: g.average }))} />
                </div>

                <div className="insight-card insight-card--half">
                    <h2>Realizadores mais bem avaliados<InfoTip>Média dos filmes de cada realizador que o clube viu, com a barra a mostrar quantos são. Mínimo de {MIN_DIRECTOR_MOVIES} filmes: os realizadores repetem-se bem menos que os atores, por isso o corte é mais baixo aqui.</InfoTip></h2>
                    <RankedBars rows={bestDirectors.map((c) => ({ key: c.name, label: <HoverAnchor detail={<MovieLines movies={c.movies} />}>{c.name}</HoverAnchor>, count: c.count, average: c.average }))} />
                </div>

                <div className="insight-card insight-card--half">
                    <h2>Atores mais bem avaliados<InfoTip>Média dos filmes em que cada ator aparece, com a barra a mostrar quantos são. Mínimo de {MIN_CREDIT_MOVIES} filmes. Entra o <b>elenco creditado todo</b> e não só os protagonistas, por isso aparecem aí nomes de papeis pequenos que calharam em três bons filmes.</InfoTip></h2>
                    <RankedBars rows={bestActors.map((c) => ({ key: c.name, label: <HoverAnchor detail={<MovieLines movies={c.movies} />}>{c.name}</HoverAnchor>, count: c.count, average: c.average }))} />
                </div>

                <div className="insight-card">
                    <h2>Filmes mais divisivos<InfoTip>Desvio-padrão das notas de cada filme: quanto maior, mais espalhadas ficaram as opiniões.<span className="info-tip-formula">σ = √( Σ(nota − média)² ÷ n )</span>Mínimo de {MIN_SPREAD_RATINGS} avaliações — duas pessoas em desacordo não são o clube dividido.</InfoTip></h2>
                    <ol className="ranking">
                        {mostDivisive.map((m) => (
                            <li key={m.slug}>
                                <span>
                                    <HoverAnchor detail={`média ${m.average.toFixed(1)} em ${m.count} notas`}>{m.movie.title}</HoverAnchor>
                                </span>
                                <strong>{m.spread.toFixed(2)}</strong>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="insight-card">
                    <h2>Filmes de maior consenso<InfoTip>A mesma lista lida ao contrário: os filmes em que as notas ficaram mais juntas.<span className="info-tip-formula">σ = √( Σ(nota − média)² ÷ n )</span>σ = 0 seria toda a gente na mesma nota. Mínimo de {MIN_SPREAD_RATINGS} avaliações.</InfoTip></h2>
                    <ol className="ranking">
                        {mostAgreed.map((m) => (
                            <li key={m.slug}>
                                <span>
                                    <HoverAnchor detail={`média ${m.average.toFixed(1)} em ${m.count} notas`}>{m.movie.title}</HoverAnchor>
                                </span>
                                <strong>{m.spread.toFixed(2)}</strong>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="insight-card">
                    <h2>Escolhas incompreendidas<InfoTip>Por filme, a nota de quem o trouxe menos a média de <b>todos os outros</b> no mesmo filme. Positivo = gostou muito mais do que o clube. Escolha a meias: conta a média dos dois, e nenhum deles entra na média dos outros. Mínimo de {MIN_OTHER_RATINGS} notas de quem não escolheu.</InfoTip></h2>
                    <ol className="ranking">
                        {misunderstood.map((m) => (
                            <li key={m.slug}>
                                <span>
                                    <HoverAnchor detail={`${m.chosenBy.join(' & ')} deu ${m.own.toFixed(1)} · os outros deram ${m.others.toFixed(1)} em ${m.count} notas`}>
                                        {m.movie.title}
                                    </HoverAnchor>
                                </span>
                                <strong>{m.gap > 0 ? '+' : ''}{m.gap.toFixed(2)}</strong>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="insight-card">
                    <h2>Filmes mais vistos<InfoTip>Quantos membros avaliaram cada filme. Os filmes antigos levam vantagem natural: já passaram por mais gente e ainda há quem vá recuperar atrasos.</InfoTip></h2>
                    <ol className="ranking">
                        {biggestCrowds.map((m) => (
                            <li key={m.slug}>
                                <span>
                                    <HoverAnchor detail={`${m.movie.year} · média ${m.average != null ? m.average.toFixed(2) : '-'}`}>{m.movie.title}</HoverAnchor>
                                </span>
                                <strong>{m.count}</strong>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="insight-card">
                    <h2>Gostos mais parecidos<InfoTip>
                        1.00 seria gosto idêntico.
                        Correlação de Pearson entre as notas dos dois nos <b>n</b> filmes que ambos viram, encolhida pelo tamanho da amostra:
                        <span className="info-tip-formula">r = Σ(a−ā)(b−b̄) ÷ √( Σ(a−ā)² × Σ(b−b̄)² )</span>
                        <span className="info-tip-formula">valor = r × n ÷ (n + {AFFINITY_SHRINK})</span>
                        ā e b̄ são as médias de cada um <i>nesses</i> n filmes. Subtraí-las é o que faz com que dar sempre mais baixo não conte como discordar. O n ÷ (n + {AFFINITY_SHRINK}) puxa para zero quem tem poucos filmes em comum. Mínimo de {MIN_SHARED} filmes.
                    </InfoTip></h2>
                    <ol className="ranking">
                        {topPairs.map((pair) => (
                            <li key={`${pair.a}-${pair.b}`}>
                                <HoverAnchor detail={`${pair.shared} filmes em comum · concordam em ${pair.agree} · ${biasLabel(pair)}`}>
                                    {pair.a} &amp; {pair.b}
                                </HoverAnchor>
                                <strong>{pair.score > 0 ? '+' : ''}{pair.score.toFixed(2)}</strong>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="insight-card">
                    <h2>Gostos mais opostos<InfoTip>
                        Negativo: quando um sobe, o outro desce.
                        Correlação de Pearson entre as notas dos dois nos <b>n</b> filmes que ambos viram, encolhida pelo tamanho da amostra:
                        <span className="info-tip-formula">r = Σ(a−ā)(b−b̄) ÷ √( Σ(a−ā)² × Σ(b−b̄)² )</span>
                        <span className="info-tip-formula">valor = r × n ÷ (n + {AFFINITY_SHRINK})</span>
                        ā e b̄ são as médias de cada um <i>nesses</i> n filmes. Subtraí-las é o que faz com que dar sempre mais baixo não conte como discordar. O n ÷ (n + {AFFINITY_SHRINK}) puxa para zero quem tem poucos filmes em comum. Mínimo de {MIN_SHARED} filmes.
                    </InfoTip></h2>
                    <ol className="ranking">
                        {worstPairs.map((pair) => (
                            <li key={`${pair.a}-${pair.b}`}>
                                <HoverAnchor detail={`${pair.shared} filmes em comum · concordam em ${pair.agree} · ${biasLabel(pair)}`}>
                                    {pair.a} &amp; {pair.b}
                                </HoverAnchor>
                                <strong>{pair.score > 0 ? '+' : ''}{pair.score.toFixed(2)}</strong>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="insight-card">
                    <h2>Quem dá notas mais odiosas<InfoTip>Nao e quem dá notas baixas, é quem <b>afunda um filme mesmo quando isso não é hábito dele</b>. A média de referência é sempre <b>sem a nota dele</b>, senão ele próprio puxava-a para baixo e a diferença saia menor. Desconta-se também o quanto cada um costuma dar acima ou abaixo dos outros — quem dá sempre meia estrela a menos não está a ser odioso, é só a escala dele.<span className="info-tip-formula">desvio = (nota − média dos outros) − viés da pessoa</span><span className="info-tip-formula">odiosidade = média dos desvios negativos</span>Mínimo de {MIN_HARSHNESS_MOVIES} filmes com {MIN_OTHER_RATINGS}+ notas de outros.</InfoTip></h2>
                    <ol className="ranking">
                        {odious.map((o) => (
                            <li key={o.name}>
                                <span>
                                    <HoverAnchor focusable={false} detail={`Ficou abaixo dos outros em ${o.count} de ${o.rated} filmes, já descontado que costuma dar ${o.bias >= 0 ? '+' : ''}${o.bias.toFixed(2)}. O pior foi ${o.worst.title}: deu ${o.worst.own.toFixed(1)} onde os outros deram ${o.worst.others.toFixed(1)}`}>
                                        <Link to={`/users/${o.name}`}>{o.name}</Link>
                                    </HoverAnchor>
                                </span>
                                <strong>{o.average.toFixed(2)}</strong>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="insight-card">
                    <h2>Quem mais comenta<InfoTip>Em quantos filmes cada um deixou comentário. Cada pessoa tem um comentário por filme, portanto é mesmo uma contagem de filmes: ou comentou ou não comentou. A percentagem é sobre os filmes que <i>essa</i> pessoa viu — em volume ganha sempre quem anda cá há mais tempo.</InfoTip></h2>
                    {topCommenters.length ? (
                        <ol className="ranking">
                            {topCommenters.map((c) => (
                                <li key={c.name}>
                                    <span>
                                        <HoverAnchor focusable={false} detail={`${Math.round(c.rate * 100)}% dos ${c.watched} filmes que viu`}>
                                            <Link to={`/users/${c.name}`}>{c.name}</Link>
                                        </HoverAnchor>
                                    </span>
                                    <strong>{c.count}</strong>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="highlight-sub">Ainda ninguém comentou nada.</p>}
                </div>

                <div className="insight-card">
                    <h2>Recomendador mais gostado<InfoTip>Média dos filmes que cada um escolheu, <b>sem a nota do próprio</b> (nem a do co-escolhedor, quando a escolha foi a meias). Filmes que mais ninguém avaliou são saltados por completo, senão quem sugeriu era penalizado por ninguém ter ido ver. Mínimo de {MIN_RECOMMENDATIONS} escolhas.</InfoTip></h2>
                    {bestSuggesters.length ? (
                        <ol className="ranking">
                            {bestSuggesters.map((s) => (
                                <li key={s.name}>
                                    <span>
                                        <HoverAnchor focusable={false} detail={`${s.count} escolhas contadas`}>
                                            <Link to={`/users/${s.name}`}>{s.name}</Link>
                                        </HoverAnchor>
                                    </span>
                                    <strong>{s.average.toFixed(2)}</strong>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="highlight-sub">Ainda ninguém escolheu filmes suficientes.</p>}
                </div>

                <div className="insight-card">
                    <h2>Quem gosta mais do que traz<InfoTip>Diferença entre a nota que deu ao filme que trouxe e a média dos <b>outros</b> no mesmo filme. Positivo = gosta mais do que traz do que o clube gosta. A nota de quem co-escolheu também fica de fora da média dos outros. Mínimo de {MIN_OWN_CHOICES} escolhas que a pessoa também tenha avaliado.</InfoTip></h2>
                    {selfLovers.length ? (
                        <ol className="ranking">
                            {selfLovers.map((s) => (
                                <li key={s.name}>
                                    <span>
                                        <HoverAnchor focusable={false} detail={`${s.count} escolhas que também avaliou`}>
                                            <Link to={`/users/${s.name}`}>{s.name}</Link>
                                        </HoverAnchor>
                                    </span>
                                    <strong>{s.average > 0 ? '+' : ''}{s.average.toFixed(2)}</strong>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="highlight-sub">Ainda ninguém escolheu filmes suficientes.</p>}
                </div>

                <div className="insight-card">
                    <h2>Quem enche a sala<InfoTip>Média de quantas pessoas avaliaram cada filme que essa pessoa escolheu. Aqui um filme que ninguém viu conta mesmo como <b>zero</b> — é precisamente o que a métrica quer medir. Mínimo de {MIN_RECOMMENDATIONS} escolhas.</InfoTip></h2>
                    {biggestAudience.length ? (
                        <ol className="ranking">
                            {biggestAudience.map((s) => (
                                <li key={s.name}>
                                    <span>
                                        <HoverAnchor focusable={false} detail={`${s.count} escolhas`}>
                                            <Link to={`/users/${s.name}`}>{s.name}</Link>
                                        </HoverAnchor>
                                    </span>
                                    <strong>{s.average.toFixed(1)}</strong>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="highlight-sub">Ainda ninguém escolheu filmes suficientes.</p>}
                </div>

                <div className="insight-card">
                    <h2>Quem escolhe mais antigo<InfoTip>Média do ano de <i>estreia</i> dos filmes que cada um escolheu, do mais antigo para o mais recente. Um filme escolhido a meias conta para os dois. Mínimo de {MIN_RECOMMENDATIONS} escolhas.</InfoTip></h2>
                    {suggesterEras.length ? (
                        <ol className="ranking">
                            {suggesterEras.map((s) => (
                                <li key={s.name}>
                                    <span>
                                        <HoverAnchor focusable={false} detail={`${s.count} escolhas`}>
                                            <Link to={`/users/${s.name}`}>{s.name}</Link>
                                        </HoverAnchor>
                                    </span>
                                    <strong>{Math.round(s.average)}</strong>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="highlight-sub">Ainda ninguém escolheu filmes suficientes.</p>}
                </div>

            </div>

            <div className="top-bottom-movies">
                <h2 className='section-title'>Melhores sagas<InfoTip>Média dos filmes de cada saga que o clube viu — a média das médias, portanto cada filme pesa o mesmo. As capas estão por ordem de estreia, com a nota do clube por baixo, e abrem o card do filme. Mínimo de {MIN_FRANCHISE_MOVIES} filmes: uma saga só conta quando há ligação entre pelo menos dois. As sagas vêm do TMDB, com correções à mão no franchises.json.</InfoTip></h2>
                <FranchiseShelf franchises={bestFranchises} />

                <div className="best-worst">
                    <div className="best-worst-col">
                        <h2 className='section-title'>Melhores avaliados</h2>
                        <div className='movie-row-grid movie-row-grid--pair'>
                            {top10.map((movie, i) => (
                                <MovieRow key={movie.slug} slug={movie.slug} movie={cinemaData[movie.slug]} rank={i + 1} />
                            ))}
                        </div>
                    </div>
                    <div className="best-worst-col">
                        <h2 className='section-title'>Piores avaliados</h2>
                        <div className='movie-row-grid movie-row-grid--pair'>
                            {worst10.map((movie, i) => (
                                <MovieRow key={movie.slug} slug={movie.slug} movie={cinemaData[movie.slug]} rank={i + 1} />
                            ))}
                        </div>
                    </div>
                </div>

                <h2 className='section-title'>Ranking de membros</h2>
                <div className="table-scroll">
                <table className='pretty-table compact-table'>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Membro</th>
                            <th>Vistos<InfoTip placement="below">Filmes do clube que já viu e avaliou.</InfoTip></th>
                            <th>Horas<InfoTip placement="below">Soma da duração dos filmes que viu, arredondada.</InfoTip></th>
                            <th>Escolhas<InfoTip placement="below">Filmes que trouxe ao clube. Um filme escolhido a meias conta para os dois.</InfoTip></th>
                            <th>Ano esc.<InfoTip placement="below">Ano médio de estreia dos filmes que escolheu.</InfoTip></th>
                            <th>Média<InfoTip placement="below">Média de todas as notas que deu.</InfoTip></th>
                            <th>Média esc.<InfoTip placement="below">Média dos filmes que escolheu, <b>sem a nota do próprio</b>. Filmes que mais ninguém avaliou são saltados.</InfoTip></th>
                            <th>Coment.<InfoTip placement="below">Em quantos filmes deixou comentário. Uma review por filme, portanto é uma contagem de filmes.</InfoTip></th>
                            <th>Streak<InfoTip placement="below">🔥 = viu os últimos x filmes seguidos. ❄️ = não viu os últimos x. Conta até ao último filme com a semana já fechada: o da semana a decorrer só entra depois de a semana acabar.</InfoTip></th>
                            <th>Max<InfoTip placement="below-right">A maior série de filmes seguidos de sempre dessa pessoa.</InfoTip></th>
                            <th>Ativo<InfoTip placement="below-right">Viu pelo menos 4 dos últimos 12 filmes com a semana já fechada.</InfoTip></th>
                        </tr>
                    </thead>
                    <tbody>
                        {top.map((viewer, index) => (
                            <tr key={viewer.name}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <Link to={`/users/${viewer.name}`}>
                                            <div className='user'>
                                                <div className='top'>
                                                        <Avatar name={viewer.name} size={28} linkToUser={false} />
                                                </div>
                                                <div className='bottom'>
                                                    {viewer.name}
                                                </div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td>{viewer.total_movies}</td>
                                    <td>{viewer.hours}</td>
                                    <td>{viewer.choices}</td>
                                    <td>{viewer.choiceYear ?? '-'}</td>
                                    <td>{viewer.average_ratings}</td>
                                    <td>{suggesterAvg[viewer.name] ? suggesterAvg[viewer.name].average.toFixed(2) : '-'}</td>
                                    <td>{viewer.comments || '-'}</td>
                                    {viewer.streak > 0 && <td>{viewer.streak} 🔥</td>}
                                    {viewer.streak < 0 && <td>{-viewer.streak} ❄️</td>}
                                    {viewer.streak === 0 && <td>-</td>}
                                    <td>{viewer.max_streak > 0 ? viewer.max_streak : '-'}</td>
                                    <td>
                                        {viewer.active === 'Yes' ? '✔️' : '❌'}
                                        <small className="table-note">{viewer.active_count}/12</small>
                                    </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>

                <h2 className='section-title'>Todos os filmes</h2>
                <div className='movie-row-grid movie-row-grid--list'>
                    {topMovies.map((movie, index) => (
                        <MovieRow key={movie.slug} slug={movie.slug} movie={cinemaData[movie.slug]} rank={index + 1} variant="list" />
                    ))}
                </div>
            </div>
        </div>


    );
}

export default CinemaClubStats;
