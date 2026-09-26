import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Movie.css';
import './ratings.scss';
import { posterSrc, backdropSrc } from '../utils/images';
import { weekRange } from '../utils/dates';
import { joinWithAmpersand } from '../utils/format';
import { averageFixed } from '../utils/ratings';
import { franchiseNeighbours } from '../utils/stats';
import { cinemaData } from './movies';
import Avatar from '../components/Avatar';

const MAX_CAST = 10; // as listas do Letterboxd vao ate 150 nomes; so o cartaz interessa

// Recebe so o slug e vai buscar o resto ao cinemaData — assim os quatro sitios
// que abrem o card nao precisam de saber que campos e que ele mostra.
// `onNavigate` (opcional) troca o filme aberto, para saltar para a prequela ou
// sequela sem fechar o modal.
// Um filme de fora do clube (so no perfil, com o Letterboxd ligado) nao esta no
// cinemaData: vem inteiro em `movie`, ja com as notas de todos os membros que o
// avaliaram no Letterboxd.
const MovieCard = ({ slug, onNavigate, movie: outside }) => {
    const root = useRef(null);
    const movie = outside || cinemaData[slug];

    // Ao saltar para a prequela/sequela o modal mantem-se aberto, portanto o
    // scroll ficava a meio do card anterior.
    useEffect(() => {
        const scroller = root.current?.closest('.modal-content');
        if (scroller) scroller.scrollTop = 0;
    }, [slug]);

    if (!movie) return null;

    const { title, year, link, date, chosenBy, genres, minutes, reviews, comments, directors, cast, external } = movie;
    const average = averageFixed(reviews, 2);
    const { prequel, sequel } = external ? {} : franchiseNeighbours(cinemaData, slug);
    const reviewers = Object.keys(reviews || {});
    const { start, end } = external ? {} : weekRange(date);
    const poster = external ? movie.poster : posterSrc(slug);
    // Os de fora nao tem backdrop: o fundo e o proprio poster, mais escurecido.
    const heroBg = external
        ? `linear-gradient(90deg, rgba(12,13,18,0.97), rgba(12,13,18,0.8)), url("${poster}")`
        : `linear-gradient(90deg, rgba(12,13,18,0.96), rgba(12,13,18,0.45)), url("${backdropSrc(slug)}")`;

    return (
        <div className="mc" ref={root}>
            <div className="mc-hero" style={{ backgroundImage: heroBg }}>
                <div className="mc-poster">
                    {poster && <img src={poster} alt={`${title} poster`} />}
                </div>
                <div className="mc-hero-info">
                    <p className="mc-kicker">{external ? 'Fora do clube · Letterboxd' : 'Filme do clube'}</p>
                    <h2 className="mc-title">{title}</h2>
                    <p className="mc-meta">
                        {[year, minutes ? `${minutes} min` : null].filter(Boolean).join(' · ')}
                        {average && average !== '-' && <> · média <b>{average}</b> ★</>}
                    </p>
                    {!external && <p className="mc-week">Semana de {start} – {end}</p>}
                    <a className="mc-link" href={link} target="_blank" rel="noopener noreferrer">Ver no Letterboxd ↗</a>
                </div>
            </div>

            <div className="mc-body">
                {!external && (
                    <section>
                        <h3>Escolhido por</h3>
                        <p className="mc-chosen">{joinWithAmpersand(chosenBy) || 'Roda do clube'}</p>
                    </section>
                )}

                {directors && directors.length > 0 && (
                    <section>
                        <h3>Realização</h3>
                        <p className="mc-chosen">{joinWithAmpersand(directors)}</p>
                    </section>
                )}

                {genres && genres.length > 0 && (
                    <section>
                        <h3>Géneros</h3>
                        <div className="mc-tags">
                            {genres.map((genre) => <span key={genre}>{genre}</span>)}
                        </div>
                    </section>
                )}

                {cast && cast.length > 0 && (
                    <section>
                        <h3>Elenco</h3>
                        <div className="mc-tags">
                            {cast.slice(0, MAX_CAST).map((actor) => <span key={actor}>{actor}</span>)}
                        </div>
                    </section>
                )}

                {(prequel || sequel) && (
                    <section>
                        <h3>Saga: {movie.franchise}</h3>
                        <div className="mc-saga">
                            {prequel && (
                                onNavigate
                                    ? <button type="button" className="mc-saga-link" onClick={() => onNavigate(prequel.slug)}>
                                        ← Prequela: {prequel.movie.title}
                                      </button>
                                    : <span className="mc-saga-link">← Prequela: {prequel.movie.title}</span>
                            )}
                            {sequel && (
                                onNavigate
                                    ? <button type="button" className="mc-saga-link" onClick={() => onNavigate(sequel.slug)}>
                                        Sequela: {sequel.movie.title} →
                                      </button>
                                    : <span className="mc-saga-link">Sequela: {sequel.movie.title} →</span>
                            )}
                        </div>
                    </section>
                )}

                <section>
                    <h3>{external ? 'Ratings dos membros no Letterboxd' : 'Ratings do clube'}</h3>
                    {reviewers.length ? (
                        <div className="mc-reviews">
                            {reviewers.map((user) => {
                                const userComment = comments && comments[user];
                                return (
                                    <div className="mc-review" key={user}>
                                        <div className="mc-review-head">
                                            <Link to={`/users/${user}`} className="mc-review-user">
                                                <Avatar name={user} size="sm" linkToUser={false} />
                                                <span>{user}</span>
                                            </Link>
                                            <ul className="rating-score mc-stars" data-rating={reviews[user]}>
                                                <li className="rating-score-item"></li>
                                                <li className="rating-score-item"></li>
                                                <li className="rating-score-item"></li>
                                                <li className="rating-score-item"></li>
                                                <li className="rating-score-item"></li>
                                            </ul>
                                        </div>
                                        {/* Um comentario por pessoa, com as quebras de linha no
                                            proprio texto (o .mc-comment tem white-space: pre-line).
                                            Vai como HTML porque ha comentarios com links a serio. */}
                                        {userComment && (
                                            <p className="mc-comment" dangerouslySetInnerHTML={{ __html: userComment }}></p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="mc-empty">Ainda sem ratings.</p>
                    )}
                </section>
            </div>
        </div>
    );
}

export default MovieCard;
