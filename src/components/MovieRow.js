import React, { useState } from 'react';
import MovieCard from '../cdc/MovieCard';
import Modal from './Modal';
import { posterSrc } from '../utils/images';
import { average } from '../utils/ratings';
import './MovieRow.css';

// Cartao horizontal clicavel: poster + titulo + notas. Abre o card no clique.
// variant: 'card' (default) ou 'list' (mais compacto, com rank).
// Um filme de fora do clube (`movie.external`, so no perfil com o Letterboxd
// ligado) abre o mesmo card, com o poster do TMDB e as notas que os membros
// lhe deram no Letterboxd.
const MovieRow = ({ slug, movie, rank, userRating, userLabel = 'rating', showClubAverage = true, variant = 'card' }) => {
    // Guarda o slug aberto (nao um booleano) para o card poder saltar para a
    // prequela/sequela sem sair do modal.
    const [openSlug, setOpenSlug] = useState(null);
    const clubAvg = average(movie.reviews);
    const clubAvgLabel = clubAvg === null ? '-' : clubAvg.toFixed(2);

    const info = (
        <div className="movie-row-info">
            <h3>{movie.title} {movie.year && <span className="movie-row-year">({movie.year})</span>}</h3>
            <div className="movie-row-ratings">
                {userRating != null && (
                    <span className="movie-row-user">{Number(userRating).toFixed(1)} ★ <span className="movie-row-note">{userLabel}</span></span>
                )}
                {/* Um de fora do clube so mostra a nota do dono do perfil: as dos
                    outros membros estao no card. */}
                {!movie.external && showClubAverage && (
                    <span className="movie-row-club">{clubAvgLabel} ★ <span className="movie-row-note">club avg</span></span>
                )}
            </div>
        </div>
    );

    if (movie.external) {
        return (
            <>
                <button className={`movie-row movie-row--${variant} movie-row--external`} onClick={() => setOpenSlug(slug)}>
                    {rank != null && <span className="movie-row-rank">{rank}</span>}
                    {movie.poster
                        ? <img src={movie.poster} alt={`${movie.title} poster`} loading="lazy" />
                        : <span className="movie-row-noposter" aria-hidden="true" />}
                    {info}
                </button>
                {openSlug && (
                    <Modal onClose={() => setOpenSlug(null)}>
                        <MovieCard slug={slug} movie={movie} />
                    </Modal>
                )}
            </>
        );
    }

    return (
        <>
            <button className={`movie-row movie-row--${variant}`} onClick={() => setOpenSlug(slug)}>
                {rank != null && <span className="movie-row-rank">{rank}</span>}
                <img src={posterSrc(slug)} alt={`${movie.title} poster`} loading="lazy" />
                {info}
            </button>
            {openSlug && (
                <Modal onClose={() => setOpenSlug(null)}>
                    <MovieCard slug={openSlug} onNavigate={setOpenSlug} />
                </Modal>
            )}
        </>
    );
};

export default MovieRow;
