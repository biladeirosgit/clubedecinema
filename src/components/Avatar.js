import React from 'react';
import { Link } from 'react-router-dom';
import { pfpSrc } from '../utils/images';

const SIZES = { sm: 32, md: 50, lg: 64 };

const Avatar = ({ name, size = 'md', linkToUser = true, className = '' }) => {
    const px = SIZES[size] || size;
    const img = (
        <img
            src={pfpSrc(name)}
            alt={name}
            className={`avatar ${className}`}
            style={{ width: px, height: px, borderRadius: '50%' }}
        />
    );
    return linkToUser ? <Link to={`/users/${name}`}>{img}</Link> : img;
};

export default Avatar;
