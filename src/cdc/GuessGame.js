import React, { useState, useEffect } from 'react';
import cinemaData from './cinemaData.json';
import randomValues from './randomValues.json'; // Importe os valores aleatórios
import MovieCard from './MovieCard';
import './GuessGame.css';
import './Movie.css';
import { posterSrc } from '../utils/images';
import { average } from '../utils/ratings';

const findByTitle = (title) => {
    const entry = Object.entries(cinemaData).find(([, movie]) => movie.title === title);
    return entry ? { slug: entry[0], ...entry[1] } : null;
};

const GuessGame = () => {
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [guesses, setGuesses] = useState([]);
    const [input, setInput] = useState('');
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [dayOfYear, setDayOfYear] = useState(null);
    const maxGuesses = 20;

    useEffect(() => {
        const now = new Date();
        now.setHours(now.getHours() + 1);

        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const todayDayOfYear = Math.floor(diff / oneDay) + 1;

        setDayOfYear(todayDayOfYear);

        const savedState = JSON.parse(localStorage.getItem('guessGameState'));
        if (savedState && savedState.dayOfYear === todayDayOfYear) {
            setGuesses(savedState.guesses || []);
            setGameOver(savedState.gameOver || false);
        }

        const timer = setInterval(() => {
            setTimeLeft(getTimeUntilMidnight());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const gameState = {
            guesses,
            gameOver,
            dayOfYear,
        };
        localStorage.setItem('guessGameState', JSON.stringify(gameState));
    }, [guesses, gameOver, dayOfYear]);

    useEffect(() => {
        const savedState = JSON.parse(localStorage.getItem('guessGameState'));
        if (savedState && savedState.dayOfYear !== dayOfYear) {
            setGuesses([]);
            setGameOver(false);
            localStorage.removeItem('guessGameState');
        }

        // Seleciona o filme aleatório baseado no dia do ano
        const randomValue = randomValues[dayOfYear % randomValues.length];
        const movieSlugs = Object.keys(cinemaData);
        const movieIndex = Math.floor(randomValue * movieSlugs.length);
        const selectedSlug = movieSlugs[movieIndex];
        setSelectedMovie({ slug: selectedSlug, ...cinemaData[selectedSlug] });
    }, [dayOfYear]);


    const getTimeUntilMidnight = () => {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        const timeDiff = midnight - now;
        const hours = Math.floor(timeDiff / 1000 / 60 / 60);
        const minutes = Math.floor((timeDiff / 1000 / 60) % 60);
        const seconds = Math.floor((timeDiff / 1000) % 60);
        return `${hours}h ${minutes}m ${seconds}s`;
    };

    const handleGuess = () => {
        if (guesses.length >= maxGuesses || gameOver) return;

        if (input === selectedMovie.title) {
            const feedback = getFeedback(input);
            setGuesses([...guesses, { guess: input, feedback }]);
            setGameOver(true);
        } else {
            if (input === "") { return; }
            if (findByTitle(input) == null) { return; }
            const feedback = getFeedback(input);
            setGuesses([...guesses, { guess: input, feedback }]);
            setInput('');
            setShowSuggestions(false);
        }
    };

    const getFeedback = (guessTitle) => {
        const guessedMovie = findByTitle(guessTitle);
        if (!guessedMovie) return null;

        const feedback = {};


        feedback.year = {
            color: getYearFeedback(guessedMovie.year, selectedMovie.year),
            value: guessedMovie.year,
            actualValue: selectedMovie.year,
            direction: guessedMovie.year < selectedMovie.year ? ' (cima)' : ' (baixo)'
        }
        feedback.minutes = {
            color: getColorFeedback(guessedMovie.minutes, selectedMovie.minutes),
            value: guessedMovie.minutes,
            actualValue: selectedMovie.minutes,
            direction: guessedMovie.minutes < selectedMovie.minutes ? ' (cima)' : ' (baixo)'
        };
        feedback.genres = {
            color: getArrayFeedback(guessedMovie.genres, selectedMovie.genres),
            value: guessedMovie.genres.join(', '),
            actualValue: selectedMovie.genres.join(', ')
        };
        feedback.reviews = {
            color: getNumberFeedback(Object.keys(guessedMovie.reviews).length, Object.keys(selectedMovie.reviews).length),
            value: Object.keys(guessedMovie.reviews).length,
            actualValue: Object.keys(selectedMovie.reviews).length,
            direction: Object.keys(guessedMovie.reviews).length < Object.keys(selectedMovie.reviews).length ? ' (cima)' : ' (baixo)'
        };
        let guessedAverage = average(guessedMovie.reviews).toFixed(2)
        let actualAverage = average(selectedMovie.reviews).toFixed(2)

        feedback.average = {
            color: getAverageFeedback(guessedAverage,actualAverage),
            value: guessedAverage,
            actualValue: actualAverage,
            direction: guessedAverage < actualAverage ? ' (cima)' : ' (baixo)'
        };
        feedback.chosenBy = {
            color: getChoosenByFeedback(guessedMovie.chosenBy,selectedMovie.chosenBy),
            value: getValueChoosenBy(guessedMovie.chosenBy),
            actualValue: selectedMovie.chosenBy
        };

        return feedback;
    };

    const getChoosenByFeedback = (guessValue, actualValue) => {
        //actual Value can be a list and guessValue can be a list
        const matchingElements = guessValue.filter(element => actualValue.includes(element));
        var ratio = 0;
        if(matchingElements.length !== 0){
            ratio = matchingElements.length / actualValue.length;
        }
        if (ratio === 1 && actualValue.length === guessValue.length) return 'green';
        if (ratio > 0) return 'yellow';
        return 'red';
    }

    const getValueChoosenBy = (guessValue) => {
        //actual Value can be a list e guessValue pode ser uma lista
        let value = guessValue[0]
        for (let i in guessValue){
            if (i==="0"){
                continue
            }
            else{
                value += " & " + guessValue[i];
            }
        }
        return value
    }

    const getAverageFeedback = (guessValue, actualValue) => {
        const diff = Math.abs(guessValue - actualValue);
        if (diff === 0) return 'green';
        if (diff <= 0.5) return 'yellow';
        return 'red';
    };

    const getYearFeedback = (guessValue, actualValue) => {
        const diff = Math.abs(guessValue - actualValue);
        if (diff === 0) return 'green';
        if (diff <= 5) return 'yellow';
        return 'red';
    };

    const getColorFeedback = (guessValue, actualValue) => {
        const diff = Math.abs(guessValue - actualValue);
        if (diff === 0) return 'green';
        if (diff <= 10) return 'yellow';
        return 'red';
    };

    const getArrayFeedback = (guessArray, actualArray) => {
        const matchingElements = guessArray.filter(element => actualArray.includes(element));
        var ratio = 0;
        if(matchingElements.length !== 0){
            ratio = matchingElements.length / actualArray.length;
        }
        if (ratio === 1 && actualArray.length === guessArray.length) return 'green';
        if (ratio > 0) return 'yellow';
        return 'red';
    };

    const getNumberFeedback = (guessNumber, actualNumber) => {
        const diff = Math.abs(guessNumber - actualNumber);
        if (diff === 0) return 'green';
        if (diff === 1) return 'yellow';
        return 'red';
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setInput(value);
        if (value) {
            const filtered = Object.values(cinemaData)
                .map(movie => movie.title)
                .filter(title =>
                    title.toLowerCase().includes(value.toLowerCase()) &&
                    !guesses.some(guessObj => guessObj.guess === title)
                );
            setFilteredMovies(filtered);
            setShowSuggestions(true);
        } else {
            setFilteredMovies([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (movieTitle) => {
        setInput(movieTitle);
        setFilteredMovies([]);
        setShowSuggestions(false);
    };

    return (
        <div className="container-guessgame">
            <p className="guess-kicker">Jogo diário</p>
            <h1>Adivinha o filme do dia</h1>
            <p className="guess-sub">Dia {dayOfYear} · {maxGuesses - guesses.length} tentativas restantes</p>
            <div className="input-container">
                <input
                    type="text"
                    value={input}
                    onChange={handleChange}
                    placeholder="Escreve um palpite…"
                    disabled={gameOver}
                />
                {showSuggestions && (
                    <div className="suggestions">
                        {filteredMovies.map((movieTitle, index) => {
                            const movie = findByTitle(movieTitle);
                            return (
                                <div key={index} className="suggestion-item" onClick={() => handleSuggestionClick(movieTitle)}>
                                    <img src={posterSrc(movie.slug)} alt={`${movieTitle} poster`} style={{ width: '36px', height: '54px' }} />
                                    <span>{movieTitle}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="button">
                <button onClick={handleGuess} disabled={gameOver}>Adivinhar</button>
            </div>

            <div className="guess-table-wrap">
                <table className='pretty-table guess-game'>
                    <thead>
                        <tr>
                            <th>Filme</th>
                            <th>Ano</th>
                            <th>Min</th>
                            <th>Géneros</th>
                            <th>Nº reviews</th>
                            <th>Média</th>
                            <th>Escolha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {guesses.map((guessObj, index) => {
                            const guessedMovie = findByTitle(guessObj.guess);
                            return (
                                <tr key={index}>
                                    <td>
                                        <div className="firstCol">
                                            <img src={posterSrc(guessedMovie.slug)} alt={`${guessObj.guess} poster`} style={{ width: '46px', height: '69px' }} />
                                            <span>{guessObj.guess}</span>
                                        </div>
                                    </td>
                                    <td className={`feedback ${guessObj.feedback.year.color}`}>
                                        {guessObj.feedback.year.value} {guessObj.feedback.year.color !== 'green' ? guessObj.feedback.year.direction : ''}
                                    </td>
                                    <td className={`feedback ${guessObj.feedback.minutes.color}`}>
                                        {guessObj.feedback.minutes.value} {guessObj.feedback.minutes.color !== 'green' ? guessObj.feedback.minutes.direction : ''}
                                    </td>
                                    <td className={`feedback ${guessObj.feedback.genres.color}`}>
                                        {guessObj.feedback.genres.value}
                                    </td>
                                    <td className={`feedback ${guessObj.feedback.reviews.color}`}>
                                        {guessObj.feedback.reviews.value} {guessObj.feedback.reviews.color !== 'green' ? guessObj.feedback.reviews.direction : ''}
                                    </td>
                                    <td className={`feedback ${guessObj.feedback.average.color}`}>
                                        {guessObj.feedback.average.value} {guessObj.feedback.average.color !== 'green' ? guessObj.feedback.average.direction : ''}
                                    </td>
                                    <td className={`feedback ${guessObj.feedback.chosenBy.color}`}>
                                        {guessObj.feedback.chosenBy.value}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {gameOver && (
                <div className="guess-win">
                    <h2>Acertaste em <b>"{selectedMovie.title}"</b> com {guesses.length} tentativas!</h2>
                    <p className="guess-next">Próximo filme em {timeLeft}</p>
                    <div className="movie-card">
                        <div className="modal-content">
                            <MovieCard
                                slug={selectedMovie.slug}
                                title={selectedMovie.title}
                                year={selectedMovie.year}
                                link={selectedMovie.link}
                                date={selectedMovie.date}
                                chosenBy={selectedMovie.chosenBy}
                                genres={selectedMovie.genres}
                                minutes={selectedMovie.minutes}
                                reviews={selectedMovie.reviews}
                                average={average(selectedMovie.reviews).toFixed(2)}
                                comments={selectedMovie.comments}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GuessGame;
