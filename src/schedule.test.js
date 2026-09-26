import React from 'react';
import { render } from '@testing-library/react';
import { hasArrived } from './utils/dates';
import { splitBySchedule } from './cdc/movies';
import UpcomingMovies from './cdc/UpcomingMovies';

// O clube passou a escolher os filmes do mes todos de uma vez, portanto o
// cinemaData tem filmes com semana marcada para o futuro. Esses nao podem
// aparecer no catalogo nem contar para estatistica nenhuma — so na faixa
// "On the way".

const movie = (date, extra = {}) => ({
    title: 'Filme',
    year: 2000,
    link: 'https://letterboxd.com/film/filme/',
    date,
    chosenBy: ['Qwerty'],
    genres: ['Drama'],
    minutes: 100,
    reviews: {},
    comments: {},
    ...extra,
});

const HOJE = new Date(2026, 7, 2); // 02/08/2026

describe('hasArrived', () => {
    test('o filme desta semana ja chegou', () => {
        expect(hasArrived('02/08/2026', HOJE)).toBe(true);
    });

    test('semanas passadas chegaram', () => {
        expect(hasArrived('26/07/2026', HOJE)).toBe(true);
    });

    test('semanas futuras ainda nao', () => {
        expect(hasArrived('09/08/2026', HOJE)).toBe(false);
    });

    // A comparacao e por dia, nao por instante: as horas do `new Date()` nao
    // podem fazer o filme de hoje contar so a partir da meia-noite seguinte.
    test('a hora do dia nao conta', () => {
        expect(hasArrived('02/08/2026', new Date(2026, 7, 2, 23, 59))).toBe(true);
        expect(hasArrived('02/08/2026', new Date(2026, 7, 2, 0, 0))).toBe(true);
    });

    // Defensivo: um filme sem data valida no weekMeta continua a contar, como
    // sempre contou. Nunca desaparece do site por causa deste filtro.
    test('sem data valida, conta', () => {
        expect(hasArrived(undefined, HOJE)).toBe(true);
        expect(hasArrived('', HOJE)).toBe(true);
    });
});

describe('splitBySchedule', () => {
    const data = {
        'ja-visto': movie('26/07/2026', { reviews: { Qwerty: 5 } }),
        'esta-semana': movie('02/08/2026'),
        'daqui-a-duas': movie('16/08/2026'),
        'para-a-semana': movie('09/08/2026'),
    };

    test('so os filmes que ja chegaram ficam no cinemaData', () => {
        const { arrived } = splitBySchedule(data, HOJE);
        expect(Object.keys(arrived).sort()).toEqual(['esta-semana', 'ja-visto']);
    });

    test('os que faltam saem por ordem cronologica', () => {
        const { upcoming } = splitBySchedule(data, HOJE);
        expect(upcoming.map((u) => u.slug)).toEqual(['para-a-semana', 'daqui-a-duas']);
    });

    // Se um filme por chegar entrasse no cinemaData, entrava com 0 reviews e
    // puxava para baixo medias, contagens de "filmes vistos" e horas de cinema.
    test('nenhum filme por chegar escapa para as estatisticas', () => {
        const { arrived } = splitBySchedule(data, HOJE);
        Object.values(arrived).forEach((m) => {
            expect(hasArrived(m.date, HOJE)).toBe(true);
        });
    });
});

describe('faixa "On the way"', () => {
    test('mostra os filmes por chegar com a semana deles', () => {
        const { container } = render(
            <UpcomingMovies movies={[{ slug: 'para-a-semana', movie: movie('09/08/2026') }]} />
        );
        expect(container.querySelector('.upcoming-name').textContent).toBe('Filme');
        expect(container.querySelector('.upcoming-week').textContent).toBe('09/08 – 15/08');
    });

    // No fim do mes, depois de o ultimo filme chegar, nao pode ficar uma
    // seccao vazia com um titulo pendurado.
    test('desaparece quando nao ha nada por chegar', () => {
        const { container } = render(<UpcomingMovies movies={[]} />);
        expect(container.querySelector('.upcoming')).toBeNull();
    });
});
