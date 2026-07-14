import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NavBar.css';

const LINKS = [
    { to: '/', label: 'Catálogo' },
    { to: '/stats', label: 'Stats' },
    { to: '/guess', label: 'Guess' },
    { to: '/roda', label: 'Roda' },
];

const NavBar = () => {
    const location = useLocation();

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">Bila<span className="brand-accent">cinema</span></Link>
            <div className="navbar-links">
                {LINKS.map((link) => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`navbar-link${location.pathname === link.to ? ' active' : ''}`}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default NavBar;
