import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Movie.css';
import './ratings.scss';
import 'https://kit.fontawesome.com/f0b16c50bd.js'

const MovieCard = ({ title, index, year, link, date, chosenBy, genres, minutes, reviews, nreviews, average, comments}) => {
    const cleanTitle = (str) => {
        return str.replace(/[^\w\s]/gi, ''); 
    };
    
    const calculateFontSize = (text) => {
        const containerWidth = 200; // Largura fixa em pixels
        let fontSize = 22; // Tamanho inicial da fonte em pixels
    
        // Cria um canvas para medir a largura do texto
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
    
        // Função para medir a largura do texto com o tamanho da fonte atual
        const measureTextWidth = (fontSize) => {
            context.font = `${fontSize}px Arial`; // Define a fonte usada
            return context.measureText(text).width;
        };
    
        // Ajusta o tamanho da fonte até que o texto caiba na largura do container
        while (measureTextWidth(fontSize) > containerWidth && fontSize > 5) {
            fontSize -= 0.5; // Decremento mais fino para maior precisão
        }
    
        return Math.max(fontSize+2, 5); // Retorna o tamanho da fonte, com um mínimo de 5 pixels
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

    date = date.split("/");
    let dateYear = date[2];
    let dateMonth = date[1];
    let dateDay = date[0];

    let dateStart = new Date(dateYear,dateMonth-1,dateDay);


    let dateFinish = new Date(dateYear,dateMonth-1,dateDay);
    dateFinish = dateFinish.addDays(6);


    let dateStartDay = addZero(dateStart.getDate())
    let dateStartMonth = addZero(dateStart.getMonth()+1)
    let dateFinishDay = addZero(dateFinish.getDate())
    let dateFinishMonth = addZero(dateFinish.getMonth()+1)


    let dateStartString = dateStartDay + "/" + dateStartMonth + "/" + dateStart.getFullYear()
    let dateFinishString = dateFinishDay + "/" + dateFinishMonth + "/" + dateFinish.getFullYear()
    

    const backgroundImage = `'/clubedecinema/backgrounds/${cleanTitle(title)}.png'`; // Caminho da imagem de fundo
    let titleYear = title + " (" + year + ")"

    return (
            <div className="container-background" style={{ backgroundImage: `url(${backgroundImage})` }}>
                <div className='container'>
                    <div className='movie'>
                        <div className='poster'>
                            <Link to={link}>
                                <img src={`/clubedecinema/posters/${cleanTitle(title)}.png`} alt={`${title} poster`} style={{ width: '200px', height: '295px' }} />
                            </Link>
                        </div>
                        <div className='title'>
                            <p style={{ fontSize: `${calculateFontSize(titleYear)}px` }}>{titleYear}</p>
                        </div>
                        <div className='year'>
                            <p>{dateStartString} - {dateFinishString}</p>
                        </div>
                        <div className='minutes'>
                            <p>{minutes} minutes</p>
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
                                                <div className='rating-top-user'>
                                                  <Link to={`/users/${Object.keys(reviews)[index]}`}>
                                                    <img
                                                      src={`/clubedecinema/pfp/${Object.keys(reviews)[index]}.png`}
                                                      alt={`${Object.keys(reviews)[index]}`}
                                                      className="reviewer-image"
                                                    />
                                                  </Link>
                                                  {comments && comments[Object.keys(reviews)[index]] && (
                                                    <>
                                                        <div className="comment-icon">
                                                            💬
                                                        </div>
                                                        <div className="comment">
                                                            {[...Array(comments[Object.keys(reviews)[index]].length)].map((_, indexComment) => (
                                                              <p
                                                                dangerouslySetInnerHTML={{
                                                                  __html: comments[Object.keys(reviews)[index]][indexComment]
                                                                }}
                                                              ></p>
                                                            ))}
                                                        </div>
                                                    </>
                                                    )}
                                                </div>
                                                <div className='rating-bottom-user'>
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
                                                <div className='rating-top-user'>
                                                  <Link to={`/users/${Object.keys(reviews)[index+4]}`}>
                                                    <img
                                                      src={`/clubedecinema/pfp/${Object.keys(reviews)[index+4]}.png`}
                                                      alt={`${Object.keys(reviews)[index+4]}`}
                                                      className="reviewer-image"
                                                    />
                                                  </Link>
                                                  {comments && comments[Object.keys(reviews)[index+4]] && (
                                                    <>
                                                        <div className="comment-icon">
                                                            💬
                                                        </div>
                                                        <div className="comment">
                                                            {[...Array(comments[Object.keys(reviews)[index + 4]].length)].map((_, indexComment) => (
                                                              <p
                                                                dangerouslySetInnerHTML={{
                                                                  __html: comments[Object.keys(reviews)[index + 4]][indexComment]
                                                                }}
                                                              ></p>
                                                            ))}
                                                        </div>
                                                    </>
                                                    )}
                                                </div>
                                                <div className='rating-bottom-user'>
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
                                                <div className='rating-top-user'>
                                                  <Link to={`/users/${Object.keys(reviews)[index+8]}`}>
                                                    <img
                                                      src={`/clubedecinema/pfp/${Object.keys(reviews)[index+8]}.png`}
                                                      alt={`${Object.keys(reviews)[index+8]}`}
                                                      className="reviewer-image"
                                                    />
                                                  </Link>
                                                  {comments && comments[Object.keys(reviews)[index+8]] && (
                                                    <>
                                                        <div className="comment-icon">
                                                            💬
                                                        </div>
                                                        <div className="comment">
                                                            {[...Array(comments[Object.keys(reviews)[index + 8]].length)].map((_, indexComment) => (
                                                              <p
                                                                dangerouslySetInnerHTML={{
                                                                  __html: comments[Object.keys(reviews)[index + 8]][indexComment]
                                                                }}
                                                              ></p>
                                                            ))}
                                                        </div>
                                                    </>
                                                    )}
                                                </div>
                                                <div className='rating-bottom-user'>
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
                        <div className="chosen" key={chosenBy[0]}>
                            <div className='center'>
                                <p>Recommendation</p>
                            </div>
                            <div className='rating-top'>
                            {[...Array(chosenBy.length)].map((_, index) => (
                                <Link to={`/users/${chosenBy[index]}`}>
                                    <img src={`/clubedecinema/pfp/${chosenBy[index]}.png`} alt={`${chosenBy[index]}`} style={{ width: '50px', height: '50px', borderRadius: '25px'}} />
                                </Link>
                            ))}
                            </div>
                            <div className='rating-bottom'>
                                {chosenBy[0]}
                                {[...Array(chosenBy.length-1)].map((_, index) => (
                                    " & " + chosenBy[index+1]
                                ))}
                            </div>
                        </div>
                        <div className="average">
                            <div className='center'>
                                <p>Average</p>
                            </div>
                            <div className='center'>
                                <h2>{average}</h2>
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
    );
}

export default MovieCard;
