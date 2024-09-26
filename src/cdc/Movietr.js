import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Movie.css';
import './ratings.scss';
import 'https://kit.fontawesome.com/f0b16c50bd.js'
import MovieCard from './MovieCard';

const Movietr = ({ title, index, year, link, date, chosenBy, genres, minutes, reviews, nreviews, average ,comments}) => {
    const [showReviews, setShowReviews] = useState(false);

    const cleanTitle = (str) => {
        return str.replace(/[^\w\s]/gi, ''); 
    };

    const backgroundImage = `'/clubedecinema/backgrounds/${cleanTitle(title)}.png'`; // Caminho da imagem de fundo

    return (
        <tr key={title} className="movie-tr" onClick={() => setShowReviews(!showReviews)} style={{ backgroundImage: `url(${backgroundImage})` }}>
            <td>{index+1}</td>
            <td className="td-movie">
                <img src={`/clubedecinema/posters/${cleanTitle(title)}.png`} alt={`${title} poster`} />
            </td>
            <td>{title}</td>
            <td>{year}</td>
            <td>
                <div className='user'>
                    <div className='top'>
                        {[...Array(chosenBy.length)].map((_, index) => (
                            <img src={`/clubedecinema/pfp/${chosenBy[index]}.png`} alt={`${chosenBy[index]}`} />
                        ))}
                    </div>
                    <div className='bottom2'>
                        {chosenBy[0]}
                        {[...Array(chosenBy.length-1)].map((_, index) => (
                            " & " + chosenBy[index+1]
                        ))}
                    </div>
                </div>
            </td>
            <td>{nreviews}</td>
            <td>{average}</td>
            {showReviews && (
                <> 
                    <div className="modal">
                        <div className="modal-content">
                            <MovieCard
                                title={title}
                                year={year}
                                link={link}
                                date={date}
                                chosenBy={chosenBy}
                                genres={genres}
                                minutes={minutes}
                                reviews={reviews}
                                average={average}
                                comments={comments}
                            />
                        </div>
                    </div>
                </>
            )}
        </tr>
    );
}

export default Movietr;
