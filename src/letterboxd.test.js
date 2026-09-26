import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { mergeLetterboxd, letterboxdCount } from './utils/letterboxd';
import { mostSimilarTo } from './utils/stats';
import { DEFAULT_FILTERS, filterProfileList } from './utils/profileList';
import UserStats from './cdc/UserStats';
import MovieRow from './components/MovieRow';
import letterboxdFilms from './cdc/letterboxdFilms.json';

const clube = {
    'do-clube': { title: 'Do Clube', year: 2000, minutes: 100, genres: ['Drama'], directors: ['A'], cast: [], themes: [], chosenBy: ['Eu'], reviews: { Eu: 4 }, comments: {}, date: '01/01/2024', tmdbId: 1 },
};
const filmes = {
    _comment: 'ignorado',
    films: {
        1: { title: 'Do Clube', year: 2000, minutes: 100, genres: [], directors: [], cast: [], poster: null, link: null },
        10: { title: 'Heat', year: 1995, minutes: 170, genres: ['Crime'], directors: ['Michael Mann'], cast: ['Al Pacino'], poster: '/p.jpg', link: 'https://letterboxd.com/film/heat-1995/' },
    },
    ratings: {
        Eu: { 10: { rating: 5, date: '02/03/2024' }, 1: { rating: 1, date: null } },
        Tu: { 10: { rating: 3, date: null } },
    },
};

describe('mergeLetterboxd', () => {
    const merged = mergeLetterboxd(clube, filmes);

    test('junta os filmes de fora ao clube, marcados como externos', () => {
        expect(Object.keys(merged).sort()).toEqual(['do-clube', 'lb-10']);
        expect(merged['lb-10']).toMatchObject({
            title: 'Heat', directors: ['Michael Mann'], external: true, chosenBy: [], themes: [],
            poster: 'https://image.tmdb.org/t/p/w185/p.jpg', link: 'https://letterboxd.com/film/heat-1995/',
        });
    });

    test('um filme do clube nunca entra como de fora, nem mexe nas notas do clube', () => {
        expect(merged['do-clube'].reviews).toEqual({ Eu: 4 });
        expect(merged['lb-1']).toBeUndefined();
    });

    test('cada filme fica com as notas e o dia de cada membro', () => {
        expect(merged['lb-10'].reviews).toEqual({ Eu: 5, Tu: 3 });
        expect(merged['lb-10'].watchedAt).toEqual({ Eu: '02/03/2024', Tu: null });
    });

    test('abrir um filme de fora mostra o card com as notas de todos os membros', () => {
        render(
            <MemoryRouter>
                <MovieRow slug="lb-10" movie={merged['lb-10']} userRating={5} userLabel="Eu" />
            </MemoryRouter>
        );
        expect(screen.queryByText(/club avg|Letterboxd/)).toBeNull(); // antes de abrir, so a nota dele
        fireEvent.click(screen.getByRole('button'));
        expect(screen.getByText('Fora do clube · Letterboxd')).toBeInTheDocument();
        expect(screen.getByText('Ratings dos membros no Letterboxd')).toBeInTheDocument();
        expect(screen.getByText('Michael Mann')).toBeInTheDocument();
        expect(screen.getByText('Tu')).toBeInTheDocument();
        expect(screen.queryByText('Escolhido por')).toBeNull();
    });

    test('nao mexe no cinemaData original', () => {
        expect(Object.keys(clube)).toEqual(['do-clube']);
    });

    test('letterboxdCount conta so quem tem filmes de fora', () => {
        expect(letterboxdCount(filmes, 'Eu')).toBe(2);
        expect(letterboxdCount(filmes, 'Ninguem')).toBe(0);
        expect(letterboxdCount(null, 'Eu')).toBe(0);
    });

    test('os filmes de fora contam para os gostos parecidos', () => {
        const muitos = { films: {}, ratings: { Eu: {}, Tu: {} } };
        [1, 2, 3, 4, 5, 6].forEach((n) => {
            const id = 100 + n;
            muitos.films[id] = { title: `F${n}`, year: 2000, genres: [], directors: [], cast: [] };
            muitos.ratings.Eu[id] = { rating: n % 5 + 1, date: null };
            muitos.ratings.Tu[id] = { rating: n % 5 + 1, date: null };
        });
        expect(mostSimilarTo(clube, 'Eu')).toEqual([]);
        expect(mostSimilarTo(mergeLetterboxd(clube, muitos), 'Eu')[0]).toMatchObject({ name: 'Tu', shared: 6 });
    });
});

describe('filterProfileList', () => {
    const item = (title, extra, rating, date = null) => ({ slug: title, rating, date, movie: { title, genres: [], chosenBy: [], directors: [], reviews: {}, ...extra } });
    const lista = [
        item('Heat', { year: 1995, minutes: 170, directors: ['Michael Mann'], genres: ['Crime'] }, 4, '01/03/2024'),
        item('Up', { year: 2009, minutes: 96, genres: ['Animation'], chosenBy: ['Tu'] }, 5, '01/01/2025'),
    ];
    const titulos = (patch) => filterProfileList(lista, { ...DEFAULT_FILTERS, ...patch }).map((i) => i.movie.title);

    test('ordena e filtra como o catalogo', () => {
        expect(titulos({})).toEqual(['Up', 'Heat']);
        expect(titulos({ sort: 'minutes' })).toEqual(['Heat', 'Up']);
        expect(titulos({ search: 'mann' })).toEqual(['Heat']);
        expect(titulos({ genre: 'Animation' })).toEqual(['Up']);
        expect(titulos({ chosenBy: 'Tu' })).toEqual(['Up']);
        expect(titulos({ yearRange: [1990, 2000] })).toEqual(['Heat']);
    });
});

// Os filmes do Letterboxd so podem aparecer no perfil: nem catalogo, nem
// estatisticas do clube, nem jogo. Garante-se pelo import.
describe('filmes do Letterboxd so no perfil', () => {
    const SRC = __dirname;
    const ficheiros = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) return ficheiros(p);
        return /\.js$/.test(e.name) && !/\.test\.js$/.test(e.name) ? [p] : [];
    });

    test('so o UserStats.js usa o letterboxdFilms.json ou o mergeLetterboxd', () => {
        const quem = ficheiros(SRC)
            .map((f) => path.relative(SRC, f).replace(/\\/g, '/'))
            .filter((f) => f !== 'utils/letterboxd.js') // o proprio helper
            .filter((f) => /import[^;]*(letterboxdFilms|utils\/letterboxd)/.test(fs.readFileSync(path.join(SRC, f), 'utf8')));
        expect(quem).toEqual(['cdc/UserStats.js']);
    });
});

describe('toggle no perfil', () => {
    const membro = Object.keys(letterboxdFilms.ratings || {}).find((k) => letterboxdCount(letterboxdFilms, k) > 0);

    const perfil = (name) => render(
        <MemoryRouter initialEntries={[`/users/${name}`]}>
            <Routes>
                <Route path="/users/:username" element={<UserStats />} />
            </Routes>
        </MemoryRouter>
    );

    beforeEach(() => localStorage.clear());

    (membro ? test : test.skip)('ligar mostra a lista de fora do clube', async () => {
        perfil(membro);
        const toggle = await screen.findByRole('checkbox');
        expect(screen.queryByText(/Fora do clube · Letterboxd/)).toBeNull();
        fireEvent.click(toggle);
        expect(screen.getByText(/Fora do clube · Letterboxd/)).toBeInTheDocument();
        expect(localStorage.getItem('cdc-profile-letterboxd')).toBe('1');
    });

    test('sem Letterboxd nao ha toggle', async () => {
        perfil('Braz');
        await screen.findByText(/Perfil de Braz/);
        await new Promise((r) => setTimeout(r, 0)); // deixa carregar o JSON
        expect(screen.queryByRole('checkbox')).toBeNull();
    });
});
