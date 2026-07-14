import React from 'react';
import { useParams, Link } from 'react-router-dom';
import cinemaData from './cinemaData.json';
import './CinemaClubStats.css';
import MovieRow from '../components/MovieRow';
import { mostSimilarTo, unratedByUser } from '../utils/stats';

const UserStats = () => {
    const { username } = useParams();

    let totalMoviesWatched = 0;
    let totalRatings = 0;
    let totalMinutesWatched = 0;
    for (const slug in cinemaData) {
        if (cinemaData.hasOwnProperty(slug)) {
            const reviews = cinemaData[slug].reviews;
            if (reviews.hasOwnProperty(username)) {
                totalMoviesWatched++;
                totalRatings += reviews[username];
                totalMinutesWatched += cinemaData[slug].minutes;
            }
        }
    }
    const averageRating = totalRatings / totalMoviesWatched;

    // Filmes vistos por este membro, ordenados pela nota que ele deu (desc).
    const watched = Object.entries(cinemaData)
        .filter(([, movie]) => username in (movie.reviews || {}))
        .map(([slug, movie]) => ({ slug, movie, rating: movie.reviews[username] }))
        .sort((a, b) => b.rating - a.rating);

    // Filmes que ele escolheu.
    const recommendations = Object.entries(cinemaData)
        .filter(([, movie]) => (movie.chosenBy || []).includes(username))
        .map(([slug, movie]) => ({ slug, movie, rating: movie.reviews?.[username] }));

    const similar = mostSimilarTo(cinemaData, username).slice(0, 6);
    const unrated = unratedByUser(cinemaData, username);

    return (
        <div className="stats-page">
            <div className='title-site'>
                <h1>Perfil de {username}</h1>
            </div>
            <div className="kpi-grid">
                <div className="kpi-tile">
                    <span className="kpi-value">{totalMoviesWatched}</span>
                    <span className="kpi-label">Filmes vistos</span>
                </div>
                <div className="kpi-tile">
                    <span className="kpi-value">{isNaN(averageRating) ? '-' : averageRating.toFixed(2)}</span>
                    <span className="kpi-label">Média que dá</span>
                </div>
                <div className="kpi-tile">
                    <span className="kpi-value">{Math.round(totalMinutesWatched / 60).toLocaleString()}</span>
                    <span className="kpi-label">Horas vistas</span>
                </div>
                <div className="kpi-tile">
                    <span className="kpi-value">{recommendations.length}</span>
                    <span className="kpi-label">Escolhas dele</span>
                </div>
            </div>

            <div className="insight-grid">
                <div className="insight-card">
                    <h2>Gostos mais parecidos</h2>
                    <p className="insight-note">% de filmes vistos por ambos em que dão nota a menos de meia estrela de distância.</p>
                    {similar.length ? (
                        <ol className="ranking">
                            {similar.map((s) => (
                                <li key={s.name}>
                                    <span><Link to={`/users/${s.name}`}>{s.name}</Link><small>concordam em {s.agree} de {s.shared} filmes</small></span>
                                    <strong>{Math.round(s.score * 100)}%</strong>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="highlight-sub">Ainda poucos filmes em comum para comparar.</p>}
                </div>
                <div className="insight-card">
                    <h2>Ainda por avaliar ({unrated.length})</h2>
                    {unrated.length ? (
                        <ol className="ranking">
                            {unrated.slice(0, 8).map((slug) => (
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

                <h2 className='section-title'>Filmes vistos</h2>
                <div className="movie-row-grid">
                    {watched.map((m) => (
                        <MovieRow key={m.slug} slug={m.slug} movie={m.movie} userRating={m.rating} userLabel={username} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default UserStats;
