import React, { useState } from 'react';
import MovieCard from '../cdc/MovieCard';
import Modal from './Modal';
import { posterSrc } from '../utils/images';
import { average } from '../utils/ratings';
import './MovieRow.css';

// Cartao horizontal clicavel: poster + titulo + notas. Abre o card no clique.
// variant: 'card' (default) ou 'list' (mais compacto, com rank).
const MovieRow = ({ slug, movie, rank, userRating, userLabel = 'rating', showClubAverage = true, variant = 'card' }) => {
    const [open, setOpen] = useState(false);
    const clubAvg = average(movie.reviews);
    const clubAvgLabel = clubAvg === null ? '-' : clubAvg.toFixed(2);

    return (
        <>
            <button className={`movie-row movie-row--${variant}`} onClick={() => setOpen(true)}>
                {rank != null && <span className="movie-row-rank">{rank}</span>}
                <img src={posterSrc(slug)} alt={`${movie.title} poster`} loading="lazy" />
                <div className="movie-row-info">
                    <h3>{movie.title} <span className="movie-row-year">({movie.year})</span></h3>
                    <div className="movie-row-ratings">
                        {userRating != null && (
                            <span className="movie-row-user">{Number(userRating).toFixed(1)} ★ <span className="movie-row-note">{userLabel}</span></span>
                        )}
                        {showClubAverage && (
                            <span className="movie-row-club">{clubAvgLabel} ★ <span className="movie-row-note">club avg</span></span>
                        )}
                    </div>
                </div>
            </button>
            {open && (
                <Modal onClose={() => setOpen(false)}>
                    <MovieCard
                        slug={slug}
                        title={movie.title}
                        year={movie.year}
                        link={movie.link}
                        date={movie.date}
                        chosenBy={movie.chosenBy}
                        genres={movie.genres}
                        minutes={movie.minutes}
                        reviews={movie.reviews}
                        average={clubAvgLabel}
                        comments={movie.comments}
                    />
                </Modal>
            )}
        </>
    );
};

export default MovieRow;
