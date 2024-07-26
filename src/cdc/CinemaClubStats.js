// src/CinemaClubStats.js

import cinemaData from './cinemaData.json'; // Importando os dados dos filmes
import RatingChart from './RatingChart';
import GenreChart from './GenreChart';
import React from 'react';
import './CinemaClubStats.css';
import Movie from './Movie';
import Movietr from './Movietr';
import { Link } from 'react-router-dom';

const CinemaClubStats = () => {

    const cleanTitle = (str) => {
        return str.replace(/[^\w\s]/gi, ''); 
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

    const calculateAvaregeMovies = () => {
        var averages = {}

        for (const [title, movie] of Object.entries(cinemaData)) {
            var total_rating = 0
            var number_of_ratings = 0
            for (const reviewer in movie.reviews) {
                total_rating += movie.reviews[reviewer];
                number_of_ratings += 1;
            }
            var average = total_rating / number_of_ratings;
            averages[title] = average.toFixed(2);
        }
        return averages;
    }
    
    const calculateTopWatchers = () => {
        var watchers = {}
        var number_movies = 0;

        var movies = Object.entries(cinemaData).sort((a, b) => {

            var date1Parts = a[1].date.split("/");
            var date1Object = new Date(+date1Parts[2], date1Parts[1] - 1, +date1Parts[0]);

            var date2Parts = b[1].date.split("/");
            var date2Object = new Date(+date2Parts[2], date2Parts[1] - 1, +date2Parts[0]); 

            return date2Object - date1Object;
        });

        for (const [title, movie] of movies) {
            number_movies+=1;
            for (const [user, rating] of Object.entries(movie.reviews)) {
                if (user in watchers){
                    watchers[user]["total_movies"] += 1
                    watchers[user]["total_ratings"] += rating
                    if(number_movies === watchers[user]["total_movies"]){
                        watchers[user]["streak"]+=1;
                    }
                    if(number_movies <= 12){
                        watchers[user]["active"]+=1;
                    }
                }
                else {
                    watchers[user] = {
                        "total_movies" : 1,
                        "total_ratings" : rating,
                        "choices" : 0,
                    }
                    if(number_movies === 1){
                        watchers[user]["streak"] = 1;
                    }
                    else{
                        watchers[user]["streak"] = 0;
                    }
                    if(number_movies <= 12){
                        watchers[user]["active"]=1;
                    }
                    else{
                        watchers[user]["active"]=0;
                    }
                }
            }
            if (movie['chosen by'] in watchers){
                watchers[movie['chosen by']]["choices"]+=1
            }
            else{
                watchers[movie['chosen by']] = {
                    "total_movies" : 0,
                    "total_ratings" : 0,
                    "choices" : 1,
                    "streak" : 0,
                    "active" : 0
                }
            }
        }
        return watchers
    }

    const calculateTopMovies = () => {
        let movies = Object.entries(cinemaData).map(([title,movie]) => {
            var reviews = 0;
            var total_rating = 0;
            
            for (const [_, rating] of Object.entries(movie.reviews)) {
                reviews += 1;
                total_rating += rating;
            }
            
            return {
                title,
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
                average_ratings: (info.total_ratings / info.total_movies).toFixed(2)
            };
        });
    
        // Ordena o array pelo total de filmes, do maior para o menor
        entries.sort((a, b) => b.total_movies - a.total_movies);
        return entries;
    }

    const watchers = calculateTopWatchers()
    const top = getTop10Viewers(watchers)
    const topMovies = calculateTopMovies()

    const top5 = topMovies.slice(0, 5)
    const worst5 = topMovies.reverse().slice(0,5)

    topMovies.reverse()

    return (
        <div>
            <div className='title-site'>
                <h1>Stats of Clube de BilaCinema</h1>
            </div>
            <div className="button">
                <Link to="/"><button>Back</button></Link>
            </div>
            <div className="stats">
                <p>Total movies: <b>{calculateTotalMovies()}</b></p>
                <p>Total minutes of films: <b>{calculateTotalMinutes()}</b></p>
                <p>Average minutes per film: <b>{calculateAverageMinutes().toFixed(2)}</b></p>
                <p>Members: <b>{findUniqueViewers()}</b></p>
                <p>Total times the films were watched: <b>{calculateTotalViewers()}</b></p>
            </div>

            <RatingChart data={calculateRatingStats()} />
            <GenreChart data={calculateGenreStats()} />
            <div className="top-bottom-movies">
                <div className='stats'>
                    <p>Best Rated Movies</p>
                </div>
                <div className='catalog'>
                    {top5.map((movie) => (
                        <>
                            <div className='movie' key={movie.title}>
                                <Movie
                                    key={movie.title}
                                    title={movie.title}
                                    year={cinemaData[movie.title].year}
                                    link={cinemaData[movie.title].link}
                                    date={cinemaData[movie.title].date}
                                    chosenBy={cinemaData[movie.title]["chosen by"]}
                                    genres={cinemaData[movie.title].genres}
                                    minutes={cinemaData[movie.title].minutes}
                                    reviews={cinemaData[movie.title].reviews}
                                />
                                <div className='stats'>
                                    <p>{movie.average}/5</p>
                                </div>
                                
                            </div>
                        </>
                    ))}
                </div>

                <div className='stats'>
                    <p>Worst Rated Movies</p>
                </div>
                <div className='catalog'>
                    {worst5.map((movie) => (
                        <>
                            <div className='movie' key={movie.title}>
                                <Movie
                                    key={movie.title}
                                    title={movie.title}
                                    year={cinemaData[movie.title].year}
                                    link={cinemaData[movie.title].link}
                                    date={cinemaData[movie.title].date}
                                    chosenBy={cinemaData[movie.title]["chosen by"]}
                                    genres={cinemaData[movie.title].genres}
                                    minutes={cinemaData[movie.title].minutes}
                                    reviews={cinemaData[movie.title].reviews}
                                />
                                <div className='stats'>
                                    <p>{movie.average}/5</p>
                                </div>
                                
                            </div>
                        </>
                    ))}
                </div>

                <div className='stats'>
                <p>Top Watchers</p>
                <table className='pretty-table'>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>User</th>
                            <th>Movies Watched</th>
                            <th>Average Rating</th>
                            <th>Recommendations</th>
                            <th>Streak</th>
                            <th>Active Member*</th>
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
                                                        <img src={`/clubedecinema/pfp/${viewer.name}.png`} alt={`${viewer.name}`} />
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
                                    <td>{viewer.streak}</td>
                                    <td>{viewer.active} ({viewer.active_count}/12)</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                    <div className='table-info'>
                        <p><b>*Active Member</b> - Member who has seen at least 4 movies out of the last 12 movies.</p>
                    </div>

                <table className='pretty-table'>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Poster</th>
                            <th>Title</th>
                            <th>Year</th>
                            <th>Recommendation</th>
                            <th>Watchers</th>
                            <th>Average Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topMovies.map((movie,index) => (
                            <Movietr
                            key={movie.title}
                            index={index}
                            title={movie.title}
                            year={cinemaData[movie.title].year}
                            link={cinemaData[movie.title].link}
                            date={cinemaData[movie.title].date}
                            chosenBy={cinemaData[movie.title]["chosen by"]}
                            genres={cinemaData[movie.title].genres}
                            minutes={cinemaData[movie.title].minutes}
                            reviews={cinemaData[movie.title].reviews}
                            nreviews={movie.reviews}
                            average={movie.average}
                        />
                        ))}
                    </tbody>
                </table>
            </div>
            </div>
        </div>

        
    );
}

export default CinemaClubStats;
