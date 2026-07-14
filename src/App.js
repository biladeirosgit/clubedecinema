// src/App.js

import React from 'react';
import { Routes, Route, HashRouter } from "react-router-dom";
import CinemaClubPage from './cdc/CinemaClubPage';
import CinemaClubStats from './cdc/CinemaClubStats'; // Importe o novo componente de estatísticas
import UserStats from './cdc/UserStats'; // Importe o novo componente de estatísticas de usuário
import GuessGame from './cdc/GuessGame';
import WheelPage from './cdc/WheelPage';
import NavBar from './components/NavBar';


const App = () => {
    return (

        <HashRouter>
            <NavBar />
            <Routes>
                <Route path="/" element={<CinemaClubPage/>} />
                <Route path="/stats" element={<CinemaClubStats/>} />
                <Route path="/users/:username" element={<UserStats/>} />
                <Route path="/guess" element={<GuessGame/>} />
                <Route path="/roda" element={<WheelPage/>} />
                {/* Adicione outras rotas aqui */}
            </Routes>
        </HashRouter>
    );
}

export default App;