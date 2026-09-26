import React from 'react';
import { posterSrc } from '../utils/images';
import { weekRange } from '../utils/dates';
import { joinWithAmpersand } from '../utils/format';
import './UpcomingMovies.css';

// So o dia e o mes: o ano ja esta implicito na semana que vem a seguir.
const shortDate = (ddmmyyyy) => ddmmyyyy.slice(0, 5);

// Filmes ja escolhidos cuja semana ainda nao comecou. Nao abrem o MovieCard
// (nao ha ratings nenhuns para mostrar) — vao direitos ao Letterboxd, que e o
// que interessa a quem ainda tem o filme por ver.
const UpcomingMovies = ({ movies }) => {
    if (!movies.length) return null;

    return (
        <section className="upcoming">
            <div className="upcoming-head">
                <h2 className="upcoming-title">On the way</h2>
                <p className="upcoming-sub">
                    {movies.length === 1 ? 'Já escolhido para a próxima semana.' : `Já escolhidos para as próximas ${movies.length} semanas.`}
                </p>
            </div>
            <div className="upcoming-grid">
                {movies.map(({ slug, movie }) => {
                    const { start, end } = weekRange(movie.date);
                    return (
                        <a
                            className="upcoming-card"
                            key={slug}
                            href={movie.link}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <div className="upcoming-poster">
                                <img src={posterSrc(slug)} alt={`${movie.title} poster`} loading="lazy" />
                                <span className="upcoming-week">{shortDate(start)} – {shortDate(end)}</span>
                            </div>
                            <h3 className="upcoming-name">{movie.title}</h3>
                            <p className="upcoming-meta">
                                {movie.year}
                                {movie.chosenBy && movie.chosenBy.length > 0 && <> · {joinWithAmpersand(movie.chosenBy)}</>}
                            </p>
                        </a>
                    );
                })}
            </div>
        </section>
    );
};

export default UpcomingMovies;
