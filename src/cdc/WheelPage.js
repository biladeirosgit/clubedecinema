import React, { useMemo, useState } from 'react';
import wheelData from './wheelData.json';
import './WheelPage.css';
import { posterSrc } from '../utils/images';
import { joinWithAmpersand } from '../utils/format';

const SEGMENT_COLORS = ['#ff7a18', '#19c2b1', '#f14c65', '#7d5cff', '#e4c16f', '#2388d9'];

const WheelPage = () => {
    const [rotation, setRotation] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [winner, setWinner] = useState(null);

    const movies = wheelData;
    const n = movies.length;

    const gradient = useMemo(() => {
        if (n === 0) return '#333';
        const stops = movies.map((_, i) => {
            const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
            return `${color} ${(i * 100 / n).toFixed(2)}% ${((i + 1) * 100 / n).toFixed(2)}%`;
        });
        return `conic-gradient(${stops.join(', ')})`;
    }, [movies, n]);

    const spin = () => {
        if (spinning || n === 0) return;
        const index = Math.floor(Math.random() * n);
        setWinner(null);
        setSpinning(true);
        // ponteiro fixo no topo; roda para o centro do segmento escolhido ficar no topo
        setRotation((value) => value + 1800 + (360 - (index * 360 / n)));
        window.setTimeout(() => {
            setWinner(movies[index]);
            setSpinning(false);
        }, 3300);
    };

    return (
        <div className="wheel-page">
            <div className="wheel-layout">
                <div className="wheel-side">
                    <p className="wheel-kicker">Escolha de domingo</p>
                    <h1>A roda do clube</h1>
                    <div className="button">
                        <button onClick={spin} disabled={spinning || n === 0}>
                            {spinning ? 'A girar…' : 'Girar a roda'}
                        </button>
                    </div>
                    {winner && (
                        <article className="wheel-winner">
                            <img
                                src={posterSrc(winner.slug)}
                                alt={`${winner.title} poster`}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <div>
                                <p className="winner-eyebrow">O filme da semana é</p>
                                <h2>{winner.title}</h2>
                                <small>
                                    {winner.year || ''}
                                    {winner.chosenBy && winner.chosenBy.length
                                        ? ` · escolha de ${joinWithAmpersand(winner.chosenBy)}`
                                        : ' · escolha sem autor'}
                                </small>
                                <a href={`https://letterboxd.com/film/${winner.slug}/`} target="_blank" rel="noopener noreferrer">
                                    Abrir no Letterboxd ↗
                                </a>
                            </div>
                        </article>
                    )}
                </div>

                <div className="wheel-wrap">
                    <i className="wheel-pointer">▼</i>
                    <div
                        className="wheel-disc"
                        style={{
                            background: gradient,
                            transform: `rotate(${rotation}deg)`,
                            transition: spinning ? 'transform 3.2s cubic-bezier(.17, .67, .32, 1)' : 'none',
                        }}
                    >
                        {movies.map((movie, i) => (
                            <span
                                key={`${movie.slug}-${i}`}
                                style={{ transform: `rotate(${i * 360 / n + 180 / n}deg)` }}
                            >
                                {movie.title}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="wheel-list">
                <h2>Na roda agora</h2>
                {n ? (
                    <ol>
                        {movies.map((movie, i) => (
                            <li key={`${movie.slug}-${i}`}>
                                {movie.title}
                                <small>{movie.chosenBy && movie.chosenBy.length ? joinWithAmpersand(movie.chosenBy) : 'autor por definir'}</small>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="wheel-empty">Ainda não há filmes na lista da roda.</p>
                )}
            </div>
        </div>
    );
};

export default WheelPage;
