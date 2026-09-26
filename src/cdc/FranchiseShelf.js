import React, { useState } from 'react';
import Modal from '../components/Modal';
import MovieCard from './MovieCard';
import Avatar from '../components/Avatar';
import { posterSrc } from '../utils/images';
import './FranchiseShelf.css';

// Sagas do clube, da melhor media para a pior, com as capas dos filmes por
// ordem de estreia. Clicar numa capa abre o card do filme, como em qualquer
// outro sitio do site -- guarda-se o slug aberto (e nao um booleano) para o
// card poder saltar para a prequela/sequela sem fechar o modal.
const FranchiseShelf = ({ franchises }) => {
    const [openSlug, setOpenSlug] = useState(null);

    if (!franchises.length) {
        return <p className="highlight-sub">Ainda não há sagas com filmes que cheguem.</p>;
    }

    return (
        <>
            <div className="franchise-shelf">
                {franchises.map((franchise, index) => (
                    <div className="franchise-row" key={franchise.name}>
                        <div className="franchise-head">
                            <span className="franchise-rank">{index + 1}</span>
                            <span className="franchise-name">{franchise.name}</span>
                            <span className="franchise-score">{franchise.average.toFixed(2)} &#9733;</span>
                        </div>
                        <div className="franchise-posters">
                            {franchise.movies.map((movie) => (
                                <button
                                    type="button"
                                    className="franchise-poster"
                                    key={movie.slug}
                                    onClick={() => setOpenSlug(movie.slug)}
                                    title={`${movie.title} (${movie.year}) — escolha de ${movie.chosenBy.join(' & ')}`}
                                >
                                    <img src={posterSrc(movie.slug)} alt={`${movie.title} poster`} loading="lazy" />
                                    <span className="franchise-poster-meta">
                                        <span className="franchise-poster-faces">
                                            {movie.chosenBy.map((who) => (
                                                <Avatar
                                                    key={who}
                                                    name={who}
                                                    size={20}
                                                    linkToUser={false}
                                                    className="franchise-poster-face"
                                                />
                                            ))}
                                        </span>
                                        <span className="franchise-poster-score">{movie.rating.toFixed(1)} &#9733;</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {openSlug && (
                <Modal onClose={() => setOpenSlug(null)}>
                    <MovieCard slug={openSlug} onNavigate={setOpenSlug} />
                </Modal>
            )}
        </>
    );
};

export default FranchiseShelf;
