import React, { useState, useEffect } from 'react';
import cinemaData from './cinemaData.json';
import randomValues from './randomValues.json'; // Importe os valores aleatórios
import MovieCard from './MovieCard';
import './GuessGame.css';
import './Movie.css';
import { Link } from 'react-router-dom';

const GuessGame = () => {
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [guesses, setGuesses] = useState([]);
    const [input, setInput] = useState('');
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const maxGuesses = 20;

    const cleanTitle = (str) => {
        return str.replace(/[^\w\s]/gi, ''); 
    };
    
    useEffect(() => {
        const now = new Date();
        // Cria um objeto Date para o início do ano
        const start = new Date(now.getFullYear(), 0, 1);
        // Calcula a diferença em milissegundos entre a data fornecida e o início do ano
        const diff = now - start;
        // Converte a diferença de milissegundos para dias
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay) + 1;

        // Seleciona o valor aleatório baseado no dia do ano
        const randomValue = randomValues[dayOfYear % randomValues.length];
        const movieKeys = Object.keys(cinemaData);
        const movieIndex = Math.floor(randomValue * movieKeys.length);
        const selectedMovieKey = movieKeys[movieIndex];
        
        setSelectedMovie({ title: selectedMovieKey, ...cinemaData[selectedMovieKey] });

        // Atualiza o cronômetro a cada segundo
        const timer = setInterval(() => {
            setTimeLeft(getTimeUntilMidnight());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

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
            const feedback = getFeedback(input);
            setGuesses([...guesses, { guess: input, feedback }]);
            setInput('');
            setShowSuggestions(false);
        }
    };

    const calculateAverage = (reviews) => {
        var totalRating = 0;
        var nReviews = 0;
        for (const [_, rating] of Object.entries(reviews)){
            totalRating += rating;
            nReviews += 1;
        }
        return (totalRating / nReviews).toFixed(2);
    }

    const getFeedback = (guess) => {
        const guessedMovie = cinemaData[guess];
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
        let guessedAverage = calculateAverage(guessedMovie.reviews)
        let actualAverage = calculateAverage(selectedMovie.reviews)

        feedback.average = {
            color: getAverageFeedback(guessedAverage,actualAverage),
            value: guessedAverage,
            actualValue: actualAverage,
            direction: guessedAverage < actualAverage ? ' (cima)' : ' (baixo)'
        };
        feedback.chosenBy = {
            color: guessedMovie['chosen by'] === selectedMovie['chosen by'] ? 'green' : 'red',
            value: guessedMovie['chosen by'],
            actualValue: selectedMovie['chosen by']
        };

        return feedback;
    };

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
        const ratio = matchingElements.length / actualArray.length;
        if (ratio === 1) return 'green';
        if (ratio >= 0) return 'yellow';
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
            const filtered = Object.keys(cinemaData).filter(movie => 
                movie.toLowerCase().includes(value.toLowerCase()) && 
                !guesses.some(guessObj => guessObj.guess === movie)
            );
            setFilteredMovies(filtered);
            setShowSuggestions(true);
        } else {
            setFilteredMovies([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (movie) => {
        setInput(movie);
        setFilteredMovies([]);
        setShowSuggestions(false);
    };

    return (
        <div className="container-guessgame">
            <h1>Guess the Movie of the Day</h1>
            <div className="input-container">
                <input 
                    type="text" 
                    value={input} 
                    onChange={handleChange} 
                    placeholder="Enter your guess..." 
                    disabled={gameOver}
                />
                {showSuggestions && (
                    <div className="suggestions">
                        {filteredMovies.map((movie, index) => (
                            <div key={index} className="suggestion-item" onClick={() => handleSuggestionClick(movie)}>
                                <img src={`/clubedecinema/posters/${cleanTitle(movie)}.png`} alt={`${movie} poster`} style={{ width: '50px', height: '73.75px' }} />
                                <span>{movie}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="button">
                <button onClick={handleGuess} disabled={gameOver}>Guess</button>
                <Link to="/"><button>Back</button></Link>
            </div>

            <div>
                <table className='pretty-table guess-game'>
                    <thead>
                        <tr>
                            <th>Movie</th>
                            <th>Year</th>
                            <th>Minutes</th>
                            <th>Genres</th>
                            <th>Number of Reviews</th>
                            <th>Average</th>
                            <th>Recommendation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {guesses.map((guessObj, index) => (
                            <tr key={index}>
                                <td>
                                    <div className="firstCol">
                                        {guessObj.guess}
                                        <img src={`/clubedecinema/posters/${cleanTitle(guessObj.guess)}.png`} alt={`${guessObj.guess} poster`} style={{ width: '100px', height: '147.5px' }} />
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
                        ))}
                    </tbody>
                </table>
            </div>

            {gameOver && (
                <div>
                    <h2>Congratulations! You got the movie "{selectedMovie.title}" right with {guesses.length} guesses!</h2>
                    <h1>Next movie in: {timeLeft}</h1>
                    <br></br>
                    <div className="movie-card">
                        <MovieCard
                            title={selectedMovie.title}
                            year={selectedMovie.year}
                            link={selectedMovie.link}
                            date={selectedMovie.date}
                            chosenBy={selectedMovie["chosen by"]}
                            genres={selectedMovie.genres}
                            minutes={selectedMovie.minutes}
                            reviews={selectedMovie.reviews}
                            average={calculateAverage(selectedMovie.reviews)}
                        />
                    </div>                    
                </div>
            )}
            <div style={{marginTop:"400px"}}>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
            </div>
        </div>
    );
}

export default GuessGame;
