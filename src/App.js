// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Routes, Route, HashRouter } from "react-router-dom";
import CinemaClubPage from './cdc/CinemaClubPage';
import CinemaClubStats from './cdc/CinemaClubStats'; // Importe o novo componente de estatísticas
import UserStats from './cdc/UserStats'; // Importe o novo componente de estatísticas de usuário



const App = () => {
    return (
        
        <HashRouter>
            <Routes>
                <Route path="/clubedecinema" element={<CinemaClubPage />} />
                <Route path="/clubedecinema/stats" element={<CinemaClubStats />} />
                <Route path="/clubedecinema/users/:username" element={<UserStats />} />
                {/* Adicione outras rotas aqui */}
            </Routes>
        </HashRouter>
    );
}

export default App;