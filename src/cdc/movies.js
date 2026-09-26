import rawCinemaData from './cinemaData.json';
import { hasArrived, compareDatesAsc } from '../utils/dates';

// Ponto de entrada unico para os dados do clube.
//
// O cinemaData.json tem os filmes de todo o mes de uma vez, incluindo os das
// semanas que ainda nao chegaram. Nenhuma pagina deve importar o JSON cru: quem
// importa daqui recebe so os filmes que ja chegaram, e portanto nao ha maneira
// de um filme por ver entrar sem querer numa media, num ranking ou no jogo.

export const splitBySchedule = (data, now = new Date()) => {
    const arrived = {};
    const upcoming = [];

    Object.entries(data).forEach(([slug, movie]) => {
        if (hasArrived(movie.date, now)) {
            arrived[slug] = movie;
        } else {
            upcoming.push({ slug, movie });
        }
    });

    // Por ordem cronologica: o proximo filme a chegar aparece primeiro.
    upcoming.sort((a, b) => compareDatesAsc(a.movie.date, b.movie.date));

    return { arrived, upcoming };
};

const { arrived, upcoming } = splitBySchedule(rawCinemaData);

// Filmes que o clube ja viu (ou esta a ver esta semana).
export const cinemaData = arrived;

// Filmes ja escolhidos mas com semana ainda por comecar: [{ slug, movie }].
export const upcomingMovies = upcoming;

export default cinemaData;
