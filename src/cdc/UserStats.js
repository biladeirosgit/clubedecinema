
import { useParams } from 'react-router-dom';
import cinemaData from './cinemaData.json';
import RatingChart from './RatingChart';
import GenreChart from './GenreChart';
import './CinemaClubStats.css';
import Movie from './Movie';
import { Link } from 'react-router-dom';

const UserStats = () => {
    const { username } = useParams();
    
    // Inicializa as variáveis para calcular as estatísticas
    let totalMoviesWatched = 0;
    let totalRatings = 0;
    let totalMinutesWatched = 0;
    const ratingsCount = {};
    const ratingsSum = {};
    // Itera sobre os filmes no JSON e coleta as revisões do usuário
    for (const movie in cinemaData) {
        if (cinemaData.hasOwnProperty(movie)) {
            const reviews = cinemaData[movie].reviews;
            // Verifica se o usuário fez uma revisão neste filme
            if (reviews.hasOwnProperty(username)) {
                const rating = reviews[username];
                // Atualiza as estatísticas com base na revisão do usuário
                totalMoviesWatched++;
                totalRatings += rating;
                totalMinutesWatched += cinemaData[movie].minutes;
                // Conta as classificações individuais para calcular a média
                if (!ratingsCount[rating]) {
                    ratingsCount[rating] = 0;
                    ratingsSum[rating] = 0;
                }
                ratingsCount[rating]++;
                ratingsSum[rating] += rating;
            }
        }
    }
    // Calcula a média de classificação
    const averageRating = totalRatings / totalMoviesWatched;
    // Calcula a média de minutos assistidos
    const averageMinutesWatched = totalMinutesWatched / totalMoviesWatched;


    // Função para calcular as estatísticas de notas
    const calculateRatingStats = () => {
        const ratings = {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0};

        for (const [, movie] of Object.entries(cinemaData)) {
            for (const reviewer in movie.reviews) {
                if (reviewer == username) {
                    const rating = movie.reviews[reviewer];
                    if (ratings[rating*2]) {
                        ratings[rating*2]++;
                    } else {
                        ratings[rating*2] = 1;
                    }
                }
            }
        }

        return ratings
    };

    // Função para calcular as estatísticas de gêneros
    const calculateGenreStats = () => {
        const genres = {};

        for (const [, movie] of Object.entries(cinemaData)) {
            //verificar se o username viu o filme
            if (username in movie.reviews) {
                for (const genre of movie.genres) {
                    if (genres[genre]) {
                        genres[genre]++;
                    } else {
                        genres[genre] = 1;
                    }
                }
            }
        }

        return genres;
    };

    const calculateRecommendations = () => {
        const recommendations = {}

        for (const [title, movie] of Object.entries(cinemaData)) {
            for(let i in movie['chosen by']){
                if (username == movie['chosen by'][i]){
                    let totalRating = 0;
                    let nReviews = 0;
                    for (const [_, rating] of Object.entries(movie.reviews)){
                        totalRating += rating;
                        nReviews += 1;
                    }
                    recommendations[title] = (totalRating/nReviews).toFixed(2);
                }
            }
            
        }

        return recommendations;
    }

    const getComments = () => {
        const comments = {}

        for (const [title,movie] of Object.entries(cinemaData)) {
            if(movie.comments){
                for(const [user,comments_movie] of Object.entries(movie.comments)){
                    if(username == user){
                        comments[title] = {
                            "comments" : comments_movie,
                            "year" : movie.year,
                            "rating" : movie.reviews[username]
                        }
                    }
                }
            }
        }
        return comments
    }


    const calculateMoviesRatedByUser = () => {
        var movies = {}

        for (const [title, movie] of Object.entries(cinemaData)) {
            if (username in movie.reviews){
                movies[title] = movie.reviews[username]
            }
        }
        return movies;
    }

    const movies = calculateMoviesRatedByUser()
    
    // Create items array
    var items = Object.keys(movies).map(function(key) {
        return [key, movies[key]];
    });

    // Sort the array based on the second element
    items.sort(function(first, second) {
        return second[1] - first[1];
      });

    // Primeiros cinco elementos
    const top5 = items.slice(0, 5);

    // Últimos cinco elementos (ou menos)
    const worst5 = items.reverse().slice(0, 5);

    var recommendations = calculateRecommendations()
    recommendations = Object.keys(recommendations).map(function(key) {
        return [key, recommendations[key]];
    });

    var comments = getComments()
    comments = Object.keys(comments).map(function(key) {
        return [key, comments[key]];
    });

    const cleanTitle = (str) => {
        return str.replace(/[^\w\s]/gi, ''); 
    };


    return (
        <>
            <div className='title-site'>
                <h1>Stats of {username}</h1>
            </div>
            <div className="button">
                <Link to="/"><button>Back</button></Link>
            </div>
            <div className="stats">
                <p>Total films watched: <b>{totalMoviesWatched}</b></p>
                <p>Rating average: <b>{averageRating.toFixed(2)}</b></p>
                <p>Total minutes watched: <b>{totalMinutesWatched}</b></p>
                <p>Average minutes watched: <b>{averageMinutesWatched.toFixed(2)}</b></p>
            </div>

            <RatingChart data={calculateRatingStats()} />
            <GenreChart data={calculateGenreStats()} />
            <div className="top-bottom-movies">
                <div className='stats'>
                    <p>Best Rated Movies</p>
                </div>
                <div className='catalog-withratings'>
                    {top5.map(([title, rating]) => (
                        <>
                            <div className='movie withratings' key={title}>
                                <Movie
                                    key={title}
                                    title={title}
                                    year={cinemaData[title].year}
                                    link={cinemaData[title].link}
                                    date={cinemaData[title].date}
                                    chosenBy={cinemaData[title]["chosen by"]}
                                    genres={cinemaData[title].genres}
                                    minutes={cinemaData[title].minutes}
                                    reviews={cinemaData[title].reviews}
                                    comments={cinemaData[title].comments}
                                />
                                <div className='stats'>
                                    <p>{rating}/5</p>
                                </div>
                                
                            </div>
                        </>
                    ))}
                </div>

                <div className='stats'>
                    <p>Worst Rated Movies</p>
                </div>
                <div className='catalog-withratings'>
                    {worst5.map(([title, rating]) => (
                        <>
                            <div className='movie' key={title}>
                                <Movie
                                    key={title}
                                    title={title}
                                    year={cinemaData[title].year}
                                    link={cinemaData[title].link}
                                    date={cinemaData[title].date}
                                    chosenBy={cinemaData[title]["chosen by"]}
                                    genres={cinemaData[title].genres}
                                    minutes={cinemaData[title].minutes}
                                    reviews={cinemaData[title].reviews}
                                    comments={cinemaData[title].comments}
                                />
                                <div className='stats'>
                                    <p>{rating}/5</p>
                                </div>
                                
                            </div>
                        </>
                    ))}
                </div>
                {Object.keys(recommendations).length !== 0 && (
                <>
                    <div className='stats'>
                        <p>Recommendations</p>
                    </div>
                    <div className='catalog-withratings'>
                        {recommendations.map(([title, rating]) => (
                            <>
                                <div className='movie withratings' key={title}>
                                    <Movie
                                        key={title}
                                        title={title}
                                        year={cinemaData[title].year}
                                        link={cinemaData[title].link}
                                        date={cinemaData[title].date}
                                        chosenBy={cinemaData[title]["chosen by"]}
                                        genres={cinemaData[title].genres}
                                        minutes={cinemaData[title].minutes}
                                        reviews={cinemaData[title].reviews}
                                        comments={cinemaData[title].comments}
                                    />
                                    <div className='stats'>
                                        <p>{rating}/5</p>
                                    </div>

                                </div>
                            </>
                        ))}
                    </div>
                </>
                )}
                {Object.keys(comments).length !== 0 && (
                <>
                    <div className='stats'>
                        <p>Comments</p>
                    </div>
                    <div className="comments-container">
                        <div className='comments-section'>
                            {comments.map(([title, movie]) => (
                                <>
                                <div className="comment-container">  
                                    <div className="comment-poster">
                                        <img src={`/clubedecinema/posters/${cleanTitle(title)}.png`} alt={`${title} poster`} style={{ width: '200px', height: '295px' }} />
                                    </div>
                                    <div className="comment-movie">
                                        <div className="comment-title">
                                            <p><b>{title}</b> ({movie.year})</p>
                                        </div>
                                        <ul className="rating-score" data-rating={movie.rating}>
                                            <li className="rating-score-item"></li>
                                            <li className="rating-score-item"></li>
                                            <li className="rating-score-item"></li>
                                            <li className="rating-score-item"></li>
                                            <li className="rating-score-item"></li>
                                        </ul>    
                                        <br></br>
                                        {[...Array(movie.comments.length)].map((_, indexComment) => (
                                            <p>{movie.comments[indexComment]}</p>
                                        ))}
                                    </div>
                                </div>
                                <hr className="comment-seperate"></hr>
                                </>
                            ))}
                        </div>
                    </div>
                </>
                )}
            </div>
        </>
    );
}

export default UserStats;
