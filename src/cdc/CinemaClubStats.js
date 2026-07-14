// src/CinemaClubStats.js

import cinemaData from './cinemaData.json'; // Importando os dados dos filmes
import React from 'react';
import './CinemaClubStats.css';
import MovieRow from '../components/MovieRow';
import { Link } from 'react-router-dom';
import { compareDatesDesc } from '../utils/dates';
import Avatar from '../components/Avatar';
import { affinityPairs, missingCountByMember } from '../utils/stats';

const CinemaClubStats = () => {

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

    // Função para calcular as estatísticas de notas
    const calculateRatingStats = () => {
        const ratings = {};


        for (const [, movie] of Object.entries(cinemaData)) {
            for (const reviewer in movie.reviews) {
                const rating = movie.reviews[reviewer];
                if (ratings[rating*2]) {
                    ratings[rating*2]++;
                } else {
                    ratings[rating*2] = 1;
                }
            }
        }


        return ratings
    };

    // Função para calcular as estatísticas de gêneros
    const calculateGenreStats = () => {
        const genres = {};

        for (const [, movie] of Object.entries(cinemaData)) {
            for (const genre of movie.genres) {
                if (genres[genre]) {
                    genres[genre]++;
                } else {
                    genres[genre] = 1;
                }
            }
        }

        return genres;
    };

    const calculateTotalMovies = () => {
        return Object.entries(cinemaData).length
    }

    const calculateTopWatchers = () => {
        var watchers = {}
        var number_movies = 0;

        var movies = Object.entries(cinemaData).sort((a, b) => compareDatesDesc(a[1].date, b[1].date));

        for (const [, movie] of movies) {
            number_movies+=1;
            let total_movie_rating = 0;
            let total_movie_reviews = 0;
            for (const [user, rating] of Object.entries(movie.reviews)) {
                total_movie_rating += rating;
                total_movie_reviews += 1;


                if (user in watchers){
                    watchers[user]["total_movies"] += 1
                    watchers[user]["total_ratings"] += rating
                    if(number_movies === watchers[user]["total_movies"]){
                        watchers[user]["streak"]+=1;
                    }
                    if(number_movies <= 12){
                        watchers[user]["active"]+=1;
                    }
                    if(watchers[user]["total_movies"] === 1){
                        watchers[user]["streak"] = -(number_movies-1);
                    }
                }
                else {
                    watchers[user] = {
                        "total_movies" : 1,
                        "total_ratings" : rating,
                        "choices" : 0,
                        "recommendations_ratings" : 0
                    }
                    if(number_movies === 1){
                        watchers[user]["streak"] = 1;
                    }
                    else{
                        watchers[user]["streak"] = -(number_movies-1);
                    }
                    if(number_movies <= 12){
                        watchers[user]["active"]=1;
                    }
                    else{
                        watchers[user]["active"]=0;
                    }
                }
            }

            let average_movie_rating = total_movie_rating/total_movie_reviews

            for(let i in movie.chosenBy){
                if (movie.chosenBy[i] in watchers){
                    watchers[movie.chosenBy[i]]["choices"]+=1
                    watchers[movie.chosenBy[i]]["recommendations_ratings"]+=average_movie_rating
                }
                else{
                    watchers[movie.chosenBy[i]] = {
                        "total_movies" : 0,
                        "total_ratings" : 0,
                        "choices" : 1,
                        "streak" : 0,
                        "active" : 0,
                        "recommendations_ratings" : average_movie_rating
                    }
                }
            }


        }
        return watchers
    }

    const calculateTopMovies = () => {
        let movies = Object.entries(cinemaData).map(([slug,movie]) => {
            var reviews = 0;
            var total_rating = 0;

            for (const [, rating] of Object.entries(movie.reviews)) {
                reviews += 1;
                total_rating += rating;
            }

            return {
                slug,
                reviews : reviews,
                average : (total_rating/reviews).toFixed(2)
            }
        })

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
                choices: info.choices,
                streak: info.streak,
                active: member_active,
                active_count: info.active,
                average_ratings: (info.total_ratings / info.total_movies).toFixed(2),
                average_recommendations_ratings : (info.recommendations_ratings / info.choices).toFixed(2)
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

    const topRanked = topMovies.slice(0, 10);
    const genreStats = calculateGenreStats();
    const topGenres = Object.entries(genreStats).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const ratingStats = calculateRatingStats();
    const maxRatingCount = Math.max(1, ...Object.values(ratingStats));
    const topPairs = affinityPairs(cinemaData).slice(0, 8);
    const missing = missingCountByMember(cinemaData).filter((m) => m.missing > 0).slice(0, 10);

    return (
        <div className="stats-page">
            <div className='title-site'>
                <h1>Estatísticas do Clube</h1>
            </div>
            <div className="kpi-grid">
                <div className="kpi-tile">
                    <span className="kpi-value">{calculateTotalMovies()}</span>
                    <span className="kpi-label">Filmes vistos</span>
                </div>
                <div className="kpi-tile">
                    <span className="kpi-value">{calculateTotalViewers()}</span>
                    <span className="kpi-label">Ratings dados</span>
                </div>
                <div className="kpi-tile">
                    <span className="kpi-value">{Math.round(calculateTotalMinutes() / 60).toLocaleString()}</span>
                    <span className="kpi-label">Horas de cinema</span>
                </div>
                <div className="kpi-tile">
                    <span className="kpi-value">{findUniqueViewers()}</span>
                    <span className="kpi-label">Membros</span>
                </div>
                <div className="kpi-tile">
                    <span className="kpi-value">{active_members}</span>
                    <span className="kpi-label">Membros ativos</span>
                </div>
                <div className="kpi-tile">
                    <span className="kpi-value">{calculateAverageMinutes().toFixed(0)}</span>
                    <span className="kpi-label">Min / filme</span>
                </div>
            </div>

            <div className="insight-grid">
                <div className="insight-card">
                    <h2>Top do clube</h2>
                    <ol className="ranking">
                        {topRanked.map((movie) => (
                            <li key={movie.slug}>
                                <span>
                                    {cinemaData[movie.slug].title}
                                    <small>{movie.reviews} ratings</small>
                                </span>
                                <strong>{movie.average} ★</strong>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="insight-card">
                    <h2>Géneros favoritos</h2>
                    <ol className="ranking">
                        {topGenres.map(([genre, count]) => (
                            <li key={genre}>
                                <span>{genre}</span>
                                <strong>{count}</strong>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="insight-card">
                    <h2>Distribuição de ratings</h2>
                    <div className="rating-bars">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((key) => {
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

                <div className="insight-card">
                    <h2>Gostos mais parecidos</h2>
                    <p className="insight-note">Concordam quando dão notas a menos de meia estrela de distância.</p>
                    <ol className="ranking">
                        {topPairs.map((pair) => (
                            <li key={`${pair.a}-${pair.b}`}>
                                <span>
                                    {pair.a} &amp; {pair.b}
                                    <small>concordam em {pair.agree} de {pair.shared} filmes vistos por ambos</small>
                                </span>
                                <strong>{Math.round(pair.score * 100)}%</strong>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="insight-card">
                    <h2>Quem falta avaliar</h2>
                    <ol className="ranking">
                        {missing.map((m) => (
                            <li key={m.name}>
                                <span><Link to={`/users/${m.name}`}>{m.name}</Link></span>
                                <strong>{m.missing} por ver</strong>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            <div className="top-bottom-movies">
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
                            <th>Vistos</th>
                            <th>Média</th>
                            <th>Escolhas</th>
                            <th>Streak</th>
                            <th>Ativo*</th>
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
                                                        <Avatar name={viewer.name} linkToUser={false} />
                                                </div>
                                                <div className='bottom'>
                                                    {viewer.name}
                                                </div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td>{viewer.total_movies}</td>
                                    <td>{viewer.average_ratings}</td>
                                    <td>{viewer.choices}</td>
                                    {viewer.streak > 0 && <td>{viewer.streak} 🔥</td>}
                                    {viewer.streak < 0 && <td>{-viewer.streak} ❄️</td>}
                                    {viewer.streak === 0 && <td>-</td>}
                                    {viewer.active === "Yes" && <td>✔️ ({viewer.active_count}/12)</td>}
                                    {viewer.active === "No" && <td>❌ ({viewer.active_count}/12)</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
                    <div className='table-info'>
                        <p><b>*Membro ativo</b> — viu pelo menos 4 dos últimos 12 filmes.</p>
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
