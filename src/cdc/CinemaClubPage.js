import React, { useState, useMemo } from 'react';
import Movie from './Movie';
import MovieCard from './MovieCard';
import Modal from '../components/Modal';
import cinemaData from './cinemaData.json';
import './CinemaClubPage.css';
import { average } from '../utils/ratings';
import { compareDatesDesc } from '../utils/dates';
import { backdropSrc, posterSrc } from '../utils/images';
import { joinWithAmpersand } from '../utils/format';

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
    const [search, setSearch] = useState('');
    const [heroExpanded, setHeroExpanded] = useState(false);

    // Calcular ano mínimo e máximo dos filmes
    const [minYear, maxYear] = useMemo(() => getYearRange(cinemaData), []);
    const [yearRange, setYearRange] = useState([minYear, maxYear]);

    const genres = useMemo(() => getUniqueValues(cinemaData, 'genres'), []);
    const chosenByPeople = useMemo(() => getUniqueValues(cinemaData, 'chosenBy'), []);

    const [heroSlug, heroMovie] = useMemo(() => {
        const entries = Object.entries(cinemaData).sort(([, a], [, b]) => compareDatesDesc(a.date, b.date));
        return entries[0] || [null, null];
    }, []);
    const heroAverage = useMemo(() => (heroMovie ? average(heroMovie.reviews) : null), [heroMovie]);

    const compareRatings = (movie1, movie2) => {
        const avg1 = average(movie1.reviews) || 0;
        const avg2 = average(movie2.reviews) || 0;
        return avg2 - avg1;
    };

    const filteredMovies = useMemo(() => {
        const query = search.trim().toLowerCase();
        return Object.entries(cinemaData)
            .filter(([slug, movie]) => {
                if (slug === heroSlug) return false; // ja aparece em destaque no hero
                const matchesSearch = query ? movie.title.toLowerCase().includes(query) : true;
                const matchesGenre = selectedGenre ? movie.genres.includes(selectedGenre) : true;
                const matchesChosenBy = selectedChosenBy ? movie.chosenBy.includes(selectedChosenBy) : true;
                const matchesYear = movie.year >= yearRange[0] && movie.year <= yearRange[1];
                return matchesSearch && matchesGenre && matchesChosenBy && matchesYear;
            })
            .sort(([, movie1], [, movie2]) => {
                if (sortCriteria === 'date') return compareDatesDesc(movie1.date, movie2.date);
                if (sortCriteria === 'rating') return compareRatings(movie1, movie2);
                if (sortCriteria === 'year') return movie2.year - movie1.year;
                return 0;
            });
    }, [search, selectedGenre, selectedChosenBy, yearRange, sortCriteria, heroSlug]);

    return (
        <div className="catalog-root">
            {heroMovie && (
                <div
                    className="hero-movie"
                    style={{ backgroundImage: `url("${backdropSrc(heroSlug)}")` }}
                    onClick={() => setHeroExpanded(true)}
                >
                    <div className="hero-movie-content">
                        <div className="hero-movie-poster">
                            <img src={posterSrc(heroSlug)} alt={`${heroMovie.title} poster`} />
                        </div>
                        <div className="hero-movie-info">
                            <div className="hero-movie-eyebrow">Filme mais recente</div>
                            <h2 className="hero-movie-title">{heroMovie.title} ({heroMovie.year})</h2>
                            <div className="hero-movie-meta">
                                Escolhido por <b>{joinWithAmpersand(heroMovie.chosenBy)}</b>
                                {heroAverage !== null && <> · média <b>{heroAverage.toFixed(2)}</b>/5</>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {heroExpanded && (
                <Modal onClose={() => setHeroExpanded(false)}>
                    <MovieCard
                        slug={heroSlug}
                        title={heroMovie.title}
                        year={heroMovie.year}
                        link={heroMovie.link}
                        date={heroMovie.date}
                        chosenBy={heroMovie.chosenBy}
                        genres={heroMovie.genres}
                        minutes={heroMovie.minutes}
                        reviews={heroMovie.reviews}
                        average={heroAverage === null ? '-' : heroAverage.toFixed(2)}
                        comments={heroMovie.comments}
                    />
                </Modal>
            )}

            {/* Filtros */}
            <div className="filters">
                <input
                    type="text"
                    className="filter-search"
                    placeholder="Procurar filme…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
                    <option value="">Todos os géneros</option>
                    {genres.map((genre, index) => (
                        <option key={index} value={genre}>{genre}</option>
                    ))}
                </select>
                <select value={selectedChosenBy} onChange={(e) => setSelectedChosenBy(e.target.value)}>
                    <option value="">Todas as escolhas</option>
                    {chosenByPeople.map((person, index) => (
                        <option key={index} value={person}>{person}</option>
                    ))}
                </select>
                <select value={sortCriteria} onChange={(e) => setSortCriteria(e.target.value)}>
                    <option value="date">Mais recentes</option>
                    <option value="rating">Melhor rating</option>
                    <option value="year">Ano</option>
                </select>
                <div className="filter-year">
                    <span className="filter-year-label">Ano {yearRange[0]}–{yearRange[1]}</span>
                    <div className="filter-year-sliders">
                        <input
                            type="range"
                            min={minYear}
                            max={maxYear}
                            value={yearRange[0]}
                            onChange={(e) => {
                                const newMin = Number(e.target.value);
                                if (newMin <= yearRange[1]) setYearRange([newMin, yearRange[1]]);
                            }}
                        />
                        <input
                            type="range"
                            min={minYear}
                            max={maxYear}
                            value={yearRange[1]}
                            onChange={(e) => {
                                const newMax = Number(e.target.value);
                                if (newMax >= yearRange[0]) setYearRange([yearRange[0], newMax]);
                            }}
                        />
                    </div>
                </div>
            </div>

            {filteredMovies.length === 0 && (
                <p className="no-results">Nenhum filme encontrado.</p>
            )}

            {/* Catálogo de filmes */}
            <div className='catalog-page'>
                {filteredMovies.map(([slug, movie], index) => (
                    <div className='movie' key={slug} style={{ animationDelay: `${Math.min(index, 20) * 0.03}s` }}>
                        <Movie
                            slug={slug}
                            title={movie.title}
                            year={movie.year}
                            link={movie.link}
                            date={movie.date}
                            chosenBy={movie.chosenBy}
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
