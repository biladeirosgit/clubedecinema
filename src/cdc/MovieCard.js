import React from 'react';
import { Link } from 'react-router-dom';
import './Movie.css';
import './ratings.scss';
import { posterSrc, backdropSrc } from '../utils/images';
import { weekRange } from '../utils/dates';
import { joinWithAmpersand } from '../utils/format';
import Avatar from '../components/Avatar';

const MovieCard = ({ slug, title, year, link, date, chosenBy, genres, minutes, reviews, average, comments }) => {
    const reviewers = Object.keys(reviews || {});
    const { start, end } = weekRange(date);
    const heroBg = `linear-gradient(90deg, rgba(12,13,18,0.96), rgba(12,13,18,0.45)), url("${backdropSrc(slug)}")`;

    return (
        <div className="mc">
            <div className="mc-hero" style={{ backgroundImage: heroBg }}>
                <div className="mc-poster">
                    <img src={posterSrc(slug)} alt={`${title} poster`} />
                </div>
                <div className="mc-hero-info">
                    <p className="mc-kicker">Filme do clube</p>
                    <h2 className="mc-title">{title}</h2>
                    <p className="mc-meta">
                        {year} · {minutes} min
                        {average && average !== '-' && <> · média <b>{average}</b> ★</>}
                    </p>
                    <p className="mc-week">Semana de {start} – {end}</p>
                    <a className="mc-link" href={link} target="_blank" rel="noopener noreferrer">Ver no Letterboxd ↗</a>
                </div>
            </div>

            <div className="mc-body">
                <section>
                    <h3>Escolhido por</h3>
                    <p className="mc-chosen">{joinWithAmpersand(chosenBy) || 'Roda do clube'}</p>
                </section>

                {genres && genres.length > 0 && (
                    <section>
                        <h3>Géneros</h3>
                        <div className="mc-tags">
                            {genres.map((genre) => <span key={genre}>{genre}</span>)}
                        </div>
                    </section>
                )}

                <section>
                    <h3>Ratings do clube</h3>
                    {reviewers.length ? (
                        <div className="mc-reviews">
                            {reviewers.map((user) => {
                                const userComments = comments && comments[user];
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
                                        {userComments && userComments.map((comment, i) => (
                                            <p className="mc-comment" key={i} dangerouslySetInnerHTML={{ __html: comment }}></p>
                                        ))}
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
