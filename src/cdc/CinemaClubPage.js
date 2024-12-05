import React, { useState, useMemo } from 'react';
import Movie from './Movie';
import cinemaData from './cinemaData.json';
import { Link } from 'react-router-dom';
import './CinemaClubPage.css';

// Helper functions
const getUniqueValues = (data, key) => {
    const values = new Set();
    Object.values(data).forEach(movie => {
        if (Array.isArray(movie[key])) {
            movie[key].forEach(item => values.add(item));
        } else {
            values.add(movie[key]);
        }
    });
    return Array.from(values).sort();
};

const getYearRange = (data) => {
    const years = Object.values(data).map(movie => movie.year);
    return [Math.min(...years), Math.max(...years)];
};

const CinemaClubPage = () => {
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedChosenBy, setSelectedChosenBy] = useState('');
    const [sortCriteria, setSortCriteria] = useState('date');

    // Calcular ano mínimo e máximo dos filmes
    const [minYear, maxYear] = useMemo(() => getYearRange(cinemaData), []);
    const [yearRange, setYearRange] = useState([minYear, maxYear]);

    const genres = useMemo(() => getUniqueValues(cinemaData, 'genres'), []);
    const chosenByPeople = useMemo(() => getUniqueValues(cinemaData, 'chosen by'), []);

    const compareDates = (movie1, movie2) => {
        const date1 = new Date(movie1.date.split('/').reverse().join('-'));
        const date2 = new Date(movie2.date.split('/').reverse().join('-'));
        return date2 - date1;
    };

    const compareRatings = (movie1, movie2) => {
        const getAverageRating = (movie) => {
            if (movie.reviews && typeof movie.reviews === 'object') {
                const ratings = Object.values(movie.reviews);
                if (ratings.length > 0) {
                    const totalRating = ratings.reduce((sum, rating) => sum + rating, 0);
                    return totalRating / ratings.length;
                }
            }
            return 0;
        };

        const avgRating1 = getAverageRating(movie1);
        const avgRating2 = getAverageRating(movie2);

        return avgRating2 - avgRating1;
    };

    const filteredMovies = useMemo(() => {
        return Object.entries(cinemaData)
            .filter(([title, movie]) => {
                const matchesGenre = selectedGenre ? movie.genres.includes(selectedGenre) : true;
                const matchesChosenBy = selectedChosenBy ? movie["chosen by"].includes(selectedChosenBy) : true;
                const matchesYear = movie.year >= yearRange[0] && movie.year <= yearRange[1];
                return matchesGenre && matchesChosenBy && matchesYear;
            })
            .sort(([, movie1], [, movie2]) => {
                if (sortCriteria === 'date') return compareDates(movie1, movie2);
                if (sortCriteria === 'rating') return compareRatings(movie1, movie2);
                if (sortCriteria === 'year') return movie2.year - movie1.year;
                return 0;
            });
    }, [selectedGenre, selectedChosenBy, yearRange, sortCriteria]);

    return (
        <div>
            <div className="title-site">
                <h1>Clube de BilaCinema</h1>
            </div>
            <div className="button">
                <Link to="/stats"><button>Stats</button></Link>
                <Link to="/guess"><button>Guess Daily Game</button></Link>
            </div>

            {/* Filtros */}
            <div className="filters">
                <label>
                    Genre:
                    <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
                        <option value="">All</option>
                        {genres.map((genre, index) => (
                            <option key={index} value={genre}>{genre}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Recommendation by:
                    <select value={selectedChosenBy} onChange={(e) => setSelectedChosenBy(e.target.value)}>
                        <option value="">All</option>
                        {chosenByPeople.map((person, index) => (
                            <option key={index} value={person}>{person}</option>
                        ))}
                    </select>
                </label>
                <label>
                    <div className="year-display">
                        <span>{yearRange[0]}</span>
                        <span>{yearRange[1]}</span>
                    </div>
                    Year:
                    {/* Slider inferior - controla o valor mínimo */}
                    <input
                        type="range"
                        min={minYear}
                        max={maxYear}
                        value={yearRange[0]}
                        onChange={(e) => {
                            const newMin = Number(e.target.value);
                            if (newMin <= yearRange[1]) {
                                setYearRange([newMin, yearRange[1]]);
                            }
                        }}
                    />
                    {/* Slider superior - controla o valor máximo */}
                    <input
                        type="range"
                        min={minYear}
                        max={maxYear}
                        value={yearRange[1]}
                        onChange={(e) => {
                            const newMax = Number(e.target.value);
                            if (newMax >= yearRange[0]) {
                                setYearRange([yearRange[0], newMax]);
                            }
                        }}
                    />
                </label>
                <label>
                    Sort by:
                    <select value={sortCriteria} onChange={(e) => setSortCriteria(e.target.value)}>
                        <option value="date">Date</option>
                        <option value="rating">Average Rating</option>
                        <option value="year">Year</option>
                    </select>
                </label>
            </div>

            {/* Catálogo de filmes */}
            <div className='catalog-page' style={{width:"100vw",height: "100vh!important"}}>
                {filteredMovies.map(([title, movie]) => (
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
                            comments={movie.comments}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CinemaClubPage;
