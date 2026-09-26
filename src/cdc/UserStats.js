import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cinemaData } from './movies';
import './CinemaClubStats.css';
import MovieRow from '../components/MovieRow';
import RankedBars, { CountAverageBars } from '../components/RankedBars';
import ProfileListFilters from '../components/ProfileListFilters';
import InfoTip from '../components/InfoTip';
import { HoverAnchor, MovieLines } from '../components/HoverBubble';
import { mostSimilarTo, unratedByUser, ratersOfSuggester, suggestersRatedBy, suggesterAverages, genreRanking, genreCounts, creditCounts, creditRanking, ratingDistribution, decadeStats, runtimeStats, RATING_BUCKETS, MIN_SHARED, AFFINITY_SHRINK, MIN_GENRE_MOVIES, MIN_CREDIT_MOVIES, MIN_DIRECTOR_MOVIES, MIN_CROSS_RATED } from '../utils/stats';
import { compareDatesDesc } from '../utils/dates';
import { mergeLetterboxd, letterboxdCount } from '../utils/letterboxd';
import { DEFAULT_FILTERS, filterProfileList, yearBounds } from '../utils/profileList';

// Preferencia de quem ve o site (nao do perfil): fica ligada ou desligada para
// todos os perfis. O localStorage pode nao existir (modo privado), dai o try.
const LETTERBOXD_KEY = 'cdc-profile-letterboxd';
const readPref = () => {
    try { return localStorage.getItem(LETTERBOXD_KEY) === '1'; } catch { return false; }
};
const writePref = (on) => {
    try { localStorage.setItem(LETTERBOXD_KEY, on ? '1' : '0'); } catch { /* sem storage: fica so nesta visita */ }
};

const UserStats = () => {
    const { username } = useParams();
    const [includeLetterboxd, setIncludeLetterboxd] = useState(readPref);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    // Os filtros sao da lista de cada pessoa: saltar para outro perfil limpa-os.
    useEffect(() => setFilters(DEFAULT_FILTERS), [username]);

    // Os filmes de fora do clube vem num ficheiro a parte, carregado so aqui:
    // quem nunca abre um perfil nao o descarrega.
    const [letterboxdFilms, setLetterboxdFilms] = useState(null);
    useEffect(() => {
        let alive = true;
        import('./letterboxdFilms.json').then((m) => { if (alive) setLetterboxdFilms(m.default); });
        return () => { alive = false; };
    }, []);
    const extraCount = letterboxdCount(letterboxdFilms, username);
    const withLetterboxd = includeLetterboxd && extraCount > 0;

    // Com o toggle ligado, as stats do perfil correm sobre o clube + os filmes
    // de fora de todos os membros (para os "gostos parecidos" contarem os
    // filmes que duas pessoas viram fora do clube). O que e sobre o clube em si
    // (escolhas, fas, ainda por ver) fica sempre so com o cinemaData.
    const data = useMemo(
        () => (withLetterboxd ? mergeLetterboxd(cinemaData, letterboxdFilms) : cinemaData),
        [withLetterboxd, letterboxdFilms],
    );

    const toggleLetterboxd = () => {
        writePref(!includeLetterboxd);
        setIncludeLetterboxd(!includeLetterboxd);
    };

    const otherBiasLabel = (other) => {
        const gap = Math.abs(other.bias);
        if (gap < 0.1) return 'dão notas igualmente generosas';
        return other.bias > 0
            ? `${username} dá +${gap.toFixed(1)}★ que ${other.name}`
            : `${other.name} dá +${gap.toFixed(1)}★ que ${username}`;
    };

    let totalMoviesWatched = 0;
    let totalRatings = 0;
    let totalMinutesWatched = 0;
    for (const slug in data) {
        if (data.hasOwnProperty(slug)) {
            const reviews = data[slug].reviews;
            if (reviews.hasOwnProperty(username)) {
                totalMoviesWatched++;
                totalRatings += reviews[username];
                totalMinutesWatched += data[slug].minutes || 0;
            }
        }
    }
    const averageRating = totalRatings / totalMoviesWatched;
    const averageMinutes = totalMinutesWatched / totalMoviesWatched;
    // Media das escolhas dele, sem a nota do proprio -- a mesma do ranking de
    // membros na pagina do clube.
    const choiceAverage = suggesterAverages(cinemaData)[username];

    // Filmes vistos por este membro. Os de fora do clube (so com o toggle) vao
    // para uma lista a parte; os filtros e a ordem sao os mesmos nas duas.
    const seen = Object.entries(data)
        .filter(([, movie]) => username in (movie.reviews || {}))
        .map(([slug, movie]) => ({
            slug,
            movie,
            rating: movie.reviews[username],
            date: movie.external ? movie.watchedAt?.[username] : movie.date,
        }));
    const watched = seen.filter((m) => !m.movie.external);
    const watchedOutside = seen.filter((m) => m.movie.external);
    const listBounds = yearBounds(seen);
    const shownWatched = filterProfileList(watched, filters, listBounds);
    const shownOutside = filterProfileList(watchedOutside, filters, listBounds);
    const countLabel = (shown, all) => (shown.length === all.length ? `${all.length}` : `${shown.length} de ${all.length}`);

    // Filmes que ele escolheu, da escolha mais recente para a mais antiga.
    const recommendations = Object.entries(cinemaData)
        .filter(([, movie]) => (movie.chosenBy || []).includes(username))
        .sort(([, a], [, b]) => compareDatesDesc(a.date, b.date))
        .map(([slug, movie]) => ({ slug, movie, rating: movie.reviews?.[username] }));

    const similar = mostSimilarTo(data, username).slice(0, 10);
    const unrated = unratedByUser(cinemaData, username);
    const fansOfChoices = ratersOfSuggester(cinemaData, username);
    const favouriteSuggesters = suggestersRatedBy(cinemaData, username);
    const topGenres = genreRanking(data, username);
    const topThemes = creditRanking(data, 'themes', username, MIN_GENRE_MOVIES);
    const suggestedGenres = genreCounts(cinemaData, username).slice(0, 10);
    const suggestedDirectors = creditCounts(cinemaData, 'directors', username).slice(0, 10);
    const suggestedActors = creditCounts(cinemaData, 'cast', username).slice(0, 10);
    const favouriteDirectors = creditRanking(data, 'directors', username, MIN_DIRECTOR_MOVIES);
    const favouriteActors = creditRanking(data, 'cast', username, MIN_CREDIT_MOVIES);
    const ratingStats = ratingDistribution(data, username);
    const maxRatingCount = Math.max(1, ...Object.values(ratingStats));
    const decades = decadeStats(data, username);
    const runtimes = runtimeStats(data, username);

    return (
        <div className="stats-page">
            <div className='title-site'>
                <h1>Perfil de {username}</h1>
            </div>
            {extraCount > 0 && (
                <div className="lb-toggle-row">
                    <label className="lb-toggle">
                        <input type="checkbox" checked={includeLetterboxd} onChange={toggleLetterboxd} />
                        <span className="lb-toggle-track" aria-hidden="true"><span className="lb-toggle-thumb" /></span>
                        <span>
                            Incluir o{' '}
                            <strong className="lb-toggle-brand">
                                <span className="lb-toggle-dots" aria-hidden="true"><i /><i /><i /></span>Letterboxd
                            </strong>{' '}
                            <span className="lb-toggle-count">+{extraCount} filmes fora do clube</span>
                        </span>
                    </label>
                    <InfoTip placement="below-right">Junta às estatísticas deste perfil os filmes que {username} avaliou no Letterboxd e que não são do clube. Mexe nos números, nas distribuições, nos gostos parecidos (também com os filmes de fora dos outros membros) e nos géneros, realizadores e atores preferidos. Os temas só existem nos filmes do clube. As escolhas, os fãs e o "ainda por ver" continuam só com o clube. Estes filmes não aparecem em mais lado nenhum do site.</InfoTip>
                </div>
            )}
            <div className="kpi-grid">
                <div className="kpi-tile">
                    <span className="kpi-value">{totalMoviesWatched}</span>
                    <span className="kpi-label">Filmes vistos</span>
                    <div className="kpi-sub">
                        <span className="kpi-sub-value">{recommendations.length}</span>
                        <span className="kpi-sub-label">Escolhas dele</span>
                    </div>
                </div>
                <div className="kpi-tile">
                    <span className="kpi-value">{isNaN(averageRating) ? '-' : averageRating.toFixed(2)}</span>
                    <span className="kpi-label">Média das notas</span>
                    <div className="kpi-sub">
                        <span className="kpi-sub-value">{choiceAverage ? choiceAverage.average.toFixed(2) : '-'}</span>
                        <span className="kpi-sub-label">Média das escolhas</span>
                    </div>
                </div>
                <div className="kpi-tile">
                    <span className="kpi-value">{Math.round(totalMinutesWatched / 60).toLocaleString()}</span>
                    <span className="kpi-label">Horas vistas</span>
                    <div className="kpi-sub">
                        <span className="kpi-sub-value">{isNaN(averageMinutes) ? '-' : averageMinutes.toFixed(0)}</span>
                        <span className="kpi-sub-label">Min / filme</span>
                    </div>
                </div>
            </div>

            <div className="insight-grid">
                <div className="insight-card insight-card--third">
                    <h2>Distribuição de ratings<InfoTip>Quantas vezes {username} deu cada nota, de meia a cinco estrelas. Uma pessoa concentrada em duas ou três barras usa pouco a escala, o que faz as médias dela dizerem menos.</InfoTip></h2>
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
                    <h2>Por década<InfoTip>A barra é quantos filmes {username} viu de cada década de <i>estreia</i>; à direita vai <b>filmes · média</b>, e a média é a das notas de {username}. Ordem cronológica, não ranking.</InfoTip></h2>
                    {decades.length ? (
                        <CountAverageBars rows={decades.map((d) => ({ key: d.decade, label: `${d.decade}s`, count: d.count, average: d.average }))} />
                    ) : <p className="highlight-sub">Ainda não viu nenhum filme.</p>}
                </div>

                <div className="insight-card insight-card--third">
                    <h2>Por duração<InfoTip>A barra é quantos filmes {username} viu em cada escalão de duração; à direita vai <b>filmes · média</b>, e a média é a das notas de {username}. Por ordem de duração, não ranking.</InfoTip></h2>
                    <CountAverageBars rows={runtimes.map((r) => ({ key: r.label, label: r.label, count: r.count, average: r.average }))} />
                </div>

                <div className="insight-card insight-card--half">
                    <h2>Géneros mais bem avaliados<InfoTip>A barra é quantos filmes de cada género {username} viu; à direita vai <b>filmes · média</b>, e dá para ordenar pela média das notas de {username} ou por quantos são. Um filme conta para todos os géneros que tem. Mínimo de {MIN_GENRE_MOVIES} filmes por género — um género com um filme só não diz nada sobre gosto.</InfoTip></h2>
                    {topGenres.length ? (
                        <RankedBars rows={topGenres.map((p) => ({
                            key: p.name,
                            label: <HoverAnchor detail={<MovieLines movies={p.movies} />}>{p.name}</HoverAnchor>,
                            count: p.count,
                            average: p.average,
                        }))} />
                    ) : <p className="highlight-sub">Ainda viu poucos filmes para comparar géneros.</p>}
                </div>

                <div className="insight-card insight-card--half">
                    <h2>Temas preferidos<InfoTip>O mesmo que os géneros, mas com os temas do Letterboxd, que são mais específicos. Um filme conta para todos os temas que tem. Mínimo de {MIN_GENRE_MOVIES} filmes por tema.</InfoTip></h2>
                    {topThemes.length ? (
                        <RankedBars rows={topThemes.map((p) => ({
                            key: p.name,
                            label: <HoverAnchor detail={<MovieLines movies={p.movies} />}>{p.name}</HoverAnchor>,
                            count: p.count,
                            average: p.average,
                        }))} />
                    ) : <p className="highlight-sub">Ainda viu poucos filmes para comparar temas.</p>}
                </div>

                <div className="insight-card insight-card--half">
                    <h2>Realizadores preferidos<InfoTip>A barra é quantos filmes de cada realizador {username} viu; à direita vai <b>filmes · média</b>, e dá para ordenar pela média das notas de {username} ou por quantos são. É sobre o que viu, não sobre o que escolheu. Mínimo de {MIN_DIRECTOR_MOVIES} filmes.</InfoTip></h2>
                    {favouriteDirectors.length ? (
                        <RankedBars rows={favouriteDirectors.map((p) => ({
                            key: p.name,
                            label: <HoverAnchor detail={<MovieLines movies={p.movies} />}>{p.name}</HoverAnchor>,
                            count: p.count,
                            average: p.average,
                        }))} />
                    ) : <p className="highlight-sub">Ainda não viu {MIN_DIRECTOR_MOVIES} filmes do mesmo realizador.</p>}
                </div>

                <div className="insight-card insight-card--half">
                    <h2>Atores preferidos<InfoTip>A barra é quantos filmes de cada ator {username} viu; à direita vai <b>filmes · média</b>, e dá para ordenar pela média das notas de {username} ou por quantos são. Mínimo de {MIN_CREDIT_MOVIES} filmes, e conta o elenco creditado todo.</InfoTip></h2>
                    {favouriteActors.length ? (
                        <RankedBars rows={favouriteActors.map((p) => ({
                            key: p.name,
                            label: <HoverAnchor detail={<MovieLines movies={p.movies} />}>{p.name}</HoverAnchor>,
                            count: p.count,
                            average: p.average,
                        }))} />
                    ) : <p className="highlight-sub">Ainda não viu {MIN_CREDIT_MOVIES} filmes do mesmo ator.</p>}
                </div>

                <div className="insight-card">
                    <h2>Gostos mais parecidos<InfoTip>
                        Negativo: quando um sobe, o outro desce.
                        Correlação de Pearson entre as notas dos dois nos <b>n</b> filmes que ambos viram, encolhida pelo tamanho da amostra:
                        <span className="info-tip-formula">r = Σ(a−ā)(b−b̄) ÷ √( Σ(a−ā)² × Σ(b−b̄)² )</span>
                        <span className="info-tip-formula">valor = r × n ÷ (n + {AFFINITY_SHRINK})</span>
                        ā e b̄ são as médias de cada um <i>nesses</i> n filmes. Subtraí-las é o que faz com que dar sempre mais baixo não conte como discordar. O n ÷ (n + {AFFINITY_SHRINK}) puxa para zero quem tem poucos filmes em comum. Mínimo de {MIN_SHARED} filmes.
                    </InfoTip></h2>
                    {similar.length ? (
                        <ol className="ranking">
                            {similar.map((s) => (
                                <li key={s.name}>
                                    <span>
                                        <HoverAnchor focusable={false} detail={`${s.shared} filmes em comum · concordam em ${s.agree} · ${otherBiasLabel(s)}`}>
                                            <Link to={`/users/${s.name}`}>{s.name}</Link>
                                        </HoverAnchor>
                                    </span>
                                    <strong>{s.score > 0 ? '+' : ''}{s.score.toFixed(2)}</strong>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="highlight-sub">Ainda poucos filmes em comum para comparar.</p>}
                </div>
                <div className="insight-card">
                    <h2>Fãs das escolhas dele<InfoTip>Média que cada pessoa deu aos filmes que {username} trouxe ao clube. Só conta quem avaliou pelo menos um deles, e a nota do próprio {username} fica de fora.</InfoTip></h2>
                    {fansOfChoices.length ? (
                        <ol className="ranking">
                            {fansOfChoices.map((r) => (
                                <li key={r.name}>
                                    <span>
                                        <HoverAnchor focusable={false} detail={`${r.count} escolhas avaliadas`}>
                                            <Link to={`/users/${r.name}`}>{r.name}</Link>
                                        </HoverAnchor>
                                    </span>
                                    <strong>{r.average.toFixed(2)}</strong>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="highlight-sub">Ainda ninguém avaliou escolhas suficientes de {username}.</p>}
                </div>
                <div className="insight-card">
                    <h2>Recomendadores favoritos<InfoTip>O inverso do card ao lado: média que {username} deu aos filmes de cada pessoa que escolhe. As escolhas do próprio {username} entram de propósito — dá para ver se se dá melhor nota do que dá aos outros. Mínimo de {MIN_CROSS_RATED} filmes avaliados por sugeridor.</InfoTip></h2>
                    {favouriteSuggesters.length ? (
                        <ol className="ranking">
                            {favouriteSuggesters.map((s) => (
                                <li key={s.name}>
                                    <span>
                                        <HoverAnchor focusable={false} detail={`${s.count} escolhas avaliadas`}>
                                            <Link to={`/users/${s.name}`}>{s.name}</Link>
                                        </HoverAnchor>
                                    </span>
                                    <strong>{s.average.toFixed(2)}</strong>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="highlight-sub">{username} ainda não avaliou escolhas suficientes de ninguém.</p>}
                </div>
                <div className="insight-card">
                    <h2>Géneros que traz<InfoTip>Géneros dos filmes que {username} <b>trouxe</b> ao clube, não dos que viu. Um filme conta para todos os géneros que tem.</InfoTip></h2>
                    {suggestedGenres.length ? (
                        <ol className="ranking">
                            {suggestedGenres.map((g) => (
                                <li key={g.name}>
                                    <span>{g.name}</span>
                                    <strong>{g.count}</strong>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="highlight-sub">Ainda não escolheu nenhum filme.</p>}
                </div>
                <div className="insight-card">
                    <h2>Realizadores que traz<InfoTip>Realizadores dos filmes que {username} <b>trouxe</b> ao clube, não dos que viu.</InfoTip></h2>
                    {suggestedDirectors.length ? (
                        <ol className="ranking">
                            {suggestedDirectors.map((p) => (
                                <li key={p.name}>
                                    <span>{p.name}</span>
                                    <strong>{p.count}</strong>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="highlight-sub">Ainda não escolheu nenhum filme.</p>}
                </div>
                <div className="insight-card">
                    <h2>Atores que traz<InfoTip>Atores dos filmes que {username} <b>trouxe</b> ao clube. Entra o elenco creditado todo, não só os protagonistas.</InfoTip></h2>
                    {suggestedActors.length ? (
                        <ol className="ranking">
                            {suggestedActors.map((p) => (
                                <li key={p.name}>
                                    <span>{p.name}</span>
                                    <strong>{p.count}</strong>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="highlight-sub">Ainda não escolheu nenhum filme.</p>}
                </div>
                <div className="insight-card">
                    <h2>Ainda por ver ({unrated.length})</h2>
                    {unrated.length ? (
                        <ol className="ranking">
                            {unrated.slice(0, 10).map((slug) => (
                                <li key={slug}><span>{cinemaData[slug].title}</span></li>
                            ))}
                        </ol>
                    ) : <p className="highlight-sub">Já avaliou tudo. Lenda. 🏆</p>}
                </div>
            </div>

            <div className="top-bottom-movies">
                {recommendations.length > 0 && (
                    <>
                        <h2 className='section-title'>Escolhas dele</h2>
                        <div className="movie-row-grid">
                            {recommendations.map((r) => (
                                <MovieRow key={r.slug} slug={r.slug} movie={r.movie} userRating={r.rating} userLabel={username} />
                            ))}
                        </div>
                    </>
                )}

                {seen.length > 0 && (
                    <div className="profile-filters">
                        <ProfileListFilters items={seen} bounds={listBounds} filters={filters} onChange={setFilters} username={username} />
                    </div>
                )}
                <h2 className='section-title'>{withLetterboxd ? 'Filmes vistos no clube' : 'Filmes vistos'} ({countLabel(shownWatched, watched)})</h2>
                {watched.length > 0 && shownWatched.length === 0 && (
                    <p className="no-results">Nenhum filme com estes filtros.</p>
                )}
                <div className="movie-row-grid">
                    {shownWatched.map((m) => (
                        <MovieRow key={m.slug} slug={m.slug} movie={m.movie} userRating={m.rating} userLabel={username} />
                    ))}
                </div>

                {withLetterboxd && (
                    <>
                        <h2 className='section-title'>Fora do clube · Letterboxd ({countLabel(shownOutside, watchedOutside)})</h2>
                        {shownOutside.length === 0 && (
                            <p className="no-results">Nenhum filme com estes filtros.</p>
                        )}
                        <div className="movie-row-grid">
                            {shownOutside.map((m) => (
                                <MovieRow key={m.slug} slug={m.slug} movie={m.movie} userRating={m.rating} userLabel={username} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default UserStats;
