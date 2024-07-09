import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Movie.css';
import './ratings.scss';
import 'https://kit.fontawesome.com/f0b16c50bd.js'

const Movietr = ({ title, index, year, link, date, chosenBy, genres, minutes, reviews, nreviews, average }) => {
    const [showReviews, setShowReviews] = useState(false);

    const cleanTitle = (str) => {
        return str.replace(/[^\w\s]/gi, ''); 
    };
    
    const calculateFontSize = (text) => {
        const containerWidth = 200; // Largura fixa em pixels
        let fontSize = 16; // Tamanho inicial da fonte em pixels

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

        return Math.max(fontSize, 5); // Retorna o tamanho da fonte, com um mínimo de 5 pixels
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
        if(number == "00"){
            number = "12";
        }
        return number;
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
                        <img src={`/clubedecinema/pfp/${chosenBy}.png`} alt={`${chosenBy}`} />
                    </div>
                    <div className='bottom2'>
                        {chosenBy}
                    </div>
                </div>
            </td>
            <td>{nreviews}</td>
            <td>{average}</td>
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
                                            <p style={{ fontSize: `${calculateFontSize(titleYear)}px` }}>{titleYear}</p>
                                        </div>
                                        <div className='year'>
                                            <p>{dateStartString} - {dateFinishString}</p>
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
                        </div>
                    </div>
                </>
            )}
        </tr>
    );
}

export default Movietr;
