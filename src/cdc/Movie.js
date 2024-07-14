import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Movie.css';
import './ratings.scss';
import 'https://kit.fontawesome.com/f0b16c50bd.js'
import MovieCard from './MovieCard';

const Movie = ({ title, year, link, date, chosenBy, genres, minutes, reviews }) => {
    const [showReviews, setShowReviews] = useState(false);

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

    const calculateAverage = () => {
        var totalRating = 0;
        var nReviews = 0;
        for (const [_, rating] of Object.entries(reviews)){
            totalRating += rating;
            nReviews += 1;
        }
        return (totalRating / nReviews).toFixed(2);
    }
    
    let titleYear = title + " (" + year + ")"

    return (
        <div className='MovieCard' onClick={() => setShowReviews(!showReviews)}> 
            <div className='simple-poster'>
                <div className='title'>
                    <p style={{ fontSize: `${calculateFontSize(titleYear)}px` }}>{titleYear}</p>
                </div>
                <div className='poster'>
                  <img src={`/clubedecinema/posters/${cleanTitle(title)}.png`} alt={`${title} poster`} style={{ width: '200px', height: '295px' }} />
                </div>
            </div>
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
                                average={calculateAverage()}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
       
    );
}

export default Movie;
