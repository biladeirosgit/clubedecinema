// src/CinemaClubPage.js

import React from 'react';
import Movie from './Movie';
import cinemaData from './cinemaData.json'; // Importando os dados dos filmes
import { Link } from 'react-router-dom';
import './CinemaClubPage.css';

const CinemaClubPage = () => {
    // Função para converter data para o formato "YYYY-MM-DD"
    const formatDate = (dateString) => {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    // Função de comparação de datas
    const compareDates = (movie1, movie2) => {
        const date1 = new Date(formatDate(movie1.date));
        const date2 = new Date(formatDate(movie2.date));
        return date2 - date1;
    };

    // Ordenando os filmes com base na data
    const sortedMovies = Object.entries(cinemaData)
        .sort(([, movie1], [, movie2]) => compareDates(movie1, movie2));

    return (
        <div>
            <div className="title-site">
                <h1>Clube de BilaCinema</h1>
            </div>
            <div className="button">
                <Link to="/stats"><button>Stats</button></Link>
            </div>
            
            <div className='catalog'>
                
                {sortedMovies.map(([title, movie]) => (
                    <div className='movie' key={title}>
                        <Movie
                            key={title}
                            title={title}
                            year={movie.year}
                            link={movie.link}
                            date={movie.date}
                            chosenBy={movie["chosen by"]}
                            genres={movie.genres}
                            minutes={movie.minutes}
                            reviews={movie.reviews}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CinemaClubPage;
