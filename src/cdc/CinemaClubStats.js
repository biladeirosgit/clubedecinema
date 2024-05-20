// src/CinemaClubStats.js

import cinemaData from './cinemaData.json'; // Importando os dados dos filmes
import RatingChart from './RatingChart';
import GenreChart from './GenreChart';
import React from 'react';
import './CinemaClubStats.css';
import Movie from './Movie';

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

    const averages = calculateAvaregeMovies()
    // Create items array
    var items = Object.keys(averages).map(function(key) {
        return [key, averages[key]];
    });

    // Sort the array based on the second element
    items.sort(function(first, second) {
      return second[1] - first[1];
    });
    const top5 = items.slice(0, 5)
    const worst5 = items.reverse().slice(0,5)

    return (
        <div>
            <div className='title-site'>
                <h1>Stats of Clube de BilaCinema</h1>
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
                    {top5.map(([title, rating]) => (
                        <>
                            <div className='movie' key={title}>
                                <Movie
                                    key={title}
                                    title={title}
                                    year={cinemaData[title].year}
                                    link={cinemaData[title].link}
                                    date={cinemaData[title].date}
                                    chosenBy={cinemaData[title]["chosen by"]}
                                    genres={cinemaData[title].genres}
                                    minutes={cinemaData[title].minutes}
                                    reviews={cinemaData[title].reviews}
                                />
                                <div className='stats'>
                                    <p>{rating}/5</p>
                                </div>
                                
                            </div>
                        </>
                    ))}
                </div>

                <div className='stats'>
                    <p>Worst Rated Movies</p>
                </div>
                <div className='catalog'>
                    {worst5.map(([title, rating]) => (
                        <>
                            <div className='movie' key={title}>
                                <Movie
                                    key={title}
                                    title={title}
                                    year={cinemaData[title].year}
                                    link={cinemaData[title].link}
                                    date={cinemaData[title].date}
                                    chosenBy={cinemaData[title]["chosen by"]}
                                    genres={cinemaData[title].genres}
                                    minutes={cinemaData[title].minutes}
                                    reviews={cinemaData[title].reviews}
                                />
                                <div className='stats'>
                                    <p>{rating}/5</p>
                                </div>
                                
                            </div>
                        </>
                    ))}
                </div>
            </div>
        </div>

        
    );
}

export default CinemaClubStats;
