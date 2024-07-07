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

    Date.prototype.addDays = function(days) {
        var date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    }

    const addZero = (number) => {
        if(number < 10){
            number = "0" + number;
        }
        return number;
    }

    const calculateAverage = () => {
        var totalRating = 0;
        var nReviews = 0;
        for (const [_, rating] of Object.entries(reviews)){
            totalRating += rating;
            nReviews += 1;
        }
        return (totalRating / nReviews).toFixed(2);
    }

    date = date.split("/");
    let dateYear = date[2];
    let dateMonth = date[1];
    let dateDay = date[0];

    let dateStart = new Date(dateYear,dateMonth,dateDay);
    let dateFinish = new Date(dateYear,dateMonth,dateDay);
    dateFinish = dateFinish.addDays(6);


    let dateStartDay = addZero(dateStart.getDate())
    let dateStartMonth = addZero(dateStart.getMonth())
    let dateFinishDay = addZero(dateFinish.getDate())
    let dateFinishMonth = addZero(dateFinish.getMonth())


    let dateStartString = dateStartDay + "/" + dateStartMonth + "/" + dateStart.getFullYear()
    let dateFinishString = dateFinishDay + "/" + dateFinishMonth + "/" + dateFinish.getFullYear()
    

    const backgroundImage = `'/clubedecinema/backgrounds/${cleanTitle(title)}.png'`; // Caminho da imagem de fundo
    let titleYear = title + " (" + year + ")"

    return (
        <div className='MovieCard' onClick={() => setShowReviews(!showReviews)}> 
            <div className='simple-poster'>
                <div className='title'>
                    <p style={{ fontSize: `${calculateFontSize2(titleYear)}vw` }}>{titleYear}</p>
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
                                            <p style={{ fontSize: `${calculateFontSize(titleYear)}vw` }}>{titleYear}</p>
                                        </div>
                                        <div className='year'>
                                            {dateStartString} - {dateFinishString}
                                        </div>
                                    </div>
                                    <div className="ratings-info">
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
                                    <div className="other-info">
                                        <div className="chosen" key={chosenBy}>
                                            <div className='center'>
                                                <p>Recommendation</p>
                                            </div>
                                            <div className='rating-top'>
                                                <Link to={`/users/${chosenBy}`}>
                                                    <img src={`/clubedecinema/pfp/${chosenBy}.png`} alt={`${chosenBy}`} style={{ width: '50px', height: '50px', borderRadius: '25px'}} />
                                                </Link>
                                            </div>
                                            <div className='rating-bottom'>
                                                {chosenBy}
                                            </div>
                                        </div>
                                        <div className="average">
                                            <div className='center'>
                                                <p>Average</p>
                                            </div>
                                            <div className='center'>
                                                <h2>{calculateAverage()}</h2>
                                            </div>
                                        </div>
                                        <div className="genres">
                                            <div className='center'>
                                                <p>Genres</p>
                                            </div>
                                            {[...Array(4)].map((_, index) => (
                                                <div className='center'>
                                                {genres[index] && (
                                                    <div className="genre" key={genres[index]}> {genres[index]} </div>
                                                )}
                                                </div>
                                            ))}
                                        </div>
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
