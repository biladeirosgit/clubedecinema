import React, { useState } from 'react';
import './Movie.css';
import './ratings.scss';
import MovieCard from './MovieCard';
import Modal from '../components/Modal';
import { posterSrc } from '../utils/images';
import { joinWithAmpersand } from '../utils/format';
import { average } from '../utils/ratings';

const Movie = ({ slug, title, year, link, date, chosenBy, genres, minutes, reviews, comments }) => {
    // Slug aberto em vez de booleano: deixa o card saltar para a prequela/sequela.
    const [openSlug, setOpenSlug] = useState(null);

    const titleYear = `${title} (${year})`;
    const avg = average(reviews);
    const avgLabel = avg === null ? '-' : avg.toFixed(1);

    return (
        <div className='MovieCard' onClick={() => setOpenSlug(slug)}>
            <div className='simple-poster'>
                <div className='title'>
                    <p>{titleYear}</p>
                </div>
                <div className='poster'>
                    <img src={posterSrc(slug)} alt={`${title} poster`} loading="lazy" />
                    <div className="poster-overlay">
                        {avg !== null && <span className="poster-overlay-avg">{avgLabel} ★</span>}
                        {chosenBy && chosenBy.length > 0 && (
                            <span className="poster-overlay-chosen">escolha de {joinWithAmpersand(chosenBy)}</span>
                        )}
                    </div>
                </div>
            </div>
            {openSlug && (
                <Modal onClose={() => setOpenSlug(null)}>
                    <MovieCard slug={openSlug} onNavigate={setOpenSlug} />
                </Modal>
            )}
        </div>
    );
}

export default Movie;
