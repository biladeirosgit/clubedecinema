import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Movie.css';
import './ratings.scss';
import 'https://kit.fontawesome.com/f0b16c50bd.js'

const Movie = ({ title, year, link, date, chosenBy, genres, minutes, reviews }) => {
    const [showReviews, setShowReviews] = useState(false);

    const cleanTitle = (str) => {
        return str.replace(/[^\w\s]/gi, ''); 
    };
    
    const calculateFontSize = (title) => {
        const titleLength = title.length;
        let fontSize = 3; // Fonte inicial
        if (titleLength > 10) {
            fontSize -= (titleLength - 7) * 0.1;
        }
        fontSize = Math.max(fontSize, 0.9);
        return Math.min(fontSize, 1.9);
    };

    const calculateFontSize2 = (title) => {
        const titleLength = title.length;
        let fontSize = 3; // Fonte inicial
        if (titleLength > 10) {
            fontSize -= (titleLength - 7) * 0.1;
        }
        fontSize = Math.max(fontSize, 0.9);
        return Math.min(fontSize, 1.9);
    };

    

    const backgroundImage = `'/clubedecinema/backgrounds/${cleanTitle(title)}.png'`; // Caminho da imagem de fundo

    return (
        <div className='MovieCard' onClick={() => setShowReviews(!showReviews)}> 
            <div className='simple-poster'>
                <div className='title'>
                    <p style={{ fontSize: `${calculateFontSize2(title)}vw` }}>{title}</p>
                </div>
                <div className='poster'>
                  <img src={`/clubedecinema/posters/${cleanTitle(title)}.png`} alt={`${title} poster`} style={{ width: '200px', height: '295px' }} />
                </div>
            </div>
            {showReviews && (
                <> 
                    <div className="modal">
                        <div className="modal-content">
                            <div className="container-background" style={{ backgroundImage: `url(${backgroundImage})` }}>
                                <div className='container'>
                                    <div className='movie'>
                                        <div className='poster'>
                                            <img src={`/clubedecinema/posters/${cleanTitle(title)}.png`} alt={`${title} poster`} style={{ width: '200px', height: '295px' }} />
                                        </div>
                                        <div className='title'>
                                            <p style={{ fontSize: `${calculateFontSize(title)}vw` }}>{title}</p>
                                        </div>
                                        <div className='year'>
                                            {year}
                                        </div>
                                    </div>
                                    <div className='ratings'>
                                        <div className='rating-col'>
                                            {[...Array(4)].map((_, index) => (
                                                <div className='rating' key={index}>
                                                    {Object.keys(reviews)[index] && (
                                                        <>
                                                            <div className='rating-user'>
                                                            <div className='rating-top'>
                                                                <Link to={`/users/${Object.keys(reviews)[index]}`}>
                                                                    <img src={`/clubedecinema/pfp/${Object.keys(reviews)[index]}.png`} alt={`${Object.keys(reviews)[index]}`} style={{ width: '50px', height: '50px', borderRadius: '25px'}} />
                                                                </Link>
                                                            </div>
                                                                <div className='rating-bottom'>
                                                                    {Object.keys(reviews)[index]}
                                                                </div>
                                                            </div>
                                                            <div className='rating-star'>
                                                                <div className='rating-top'>
                                                                    <ul className="rating-score" data-rating={reviews[Object.keys(reviews)[index]]}>
                                                                        <li className="rating-score-item"></li>
                                                                        <li className="rating-score-item"></li>
                                                                        <li className="rating-score-item"></li>
                                                                        <li className="rating-score-item"></li>
                                                                        <li className="rating-score-item"></li>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className='rating-col'>
                                            {[...Array(4)].map((_, index) => (
                                                <div className='rating' key={index}>
                                                    {Object.keys(reviews)[index+4] && (
                                                        <>
                                                            <div className='rating-user'>
                                                            <div className='rating-top'>
                                                                <Link to={`/users/${Object.keys(reviews)[index+4]}`}>
                                                                <img src={`/clubedecinema/pfp/${Object.keys(reviews)[index+4]}.png`} alt={`${Object.keys(reviews)[index+4]}`} style={{ width: '50px', height: '50px', borderRadius: '25px'}} />
                                                                </Link>
                                                                </div>
                                                                <div className='rating-bottom'>
                                                                    {Object.keys(reviews)[index+4]}
                                                                </div>
                                                            </div>
                                                            <div className='rating-star'>
                                                                <div className='rating-top'>
                                                                    <ul className="rating-score" data-rating={reviews[Object.keys(reviews)[index+4]]}>
                                                                        <li className="rating-score-item"></li>
                                                                        <li className="rating-score-item"></li>
                                                                        <li className="rating-score-item"></li>
                                                                        <li className="rating-score-item"></li>
                                                                        <li className="rating-score-item"></li>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className='rating-col'>
                                            {[...Array(4)].map((_, index) => (
                                                <div className='rating' key={index}>
                                                    {Object.keys(reviews)[index+8] && (
                                                        <>
                                                            <div className='rating-user'>
                                                            <div className='rating-top'>
                                                                <Link to={`/users/${Object.keys(reviews)[index+8]}`}>
                                                                <img src={`/clubedecinema/pfp/${Object.keys(reviews)[index+8]}.png`} alt={`${Object.keys(reviews)[index+8]}`} style={{ width: '50px', height: '50px', borderRadius: '25px'}} />
                                                                </Link>
                                                                </div>
                                                                <div className='rating-bottom'>
                                                                    {Object.keys(reviews)[index+8]}
                                                                </div>
                                                            </div>
                                                            <div className='rating-star'>
                                                                <div className='rating-top'>
                                                                    <ul className="rating-score" data-rating={reviews[Object.keys(reviews)[index+8]]}>
                                                                        <li className="rating-score-item"></li>
                                                                        <li className="rating-score-item"></li>
                                                                        <li className="rating-score-item"></li>
                                                                        <li className="rating-score-item"></li>
                                                                        <li className="rating-score-item"></li>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
       
    );
}

export default Movie;
