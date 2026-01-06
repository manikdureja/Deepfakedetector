import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 1. Added 'Link' import here
import logo from './assets/logo.png';
import Search_icon from './assets/search_icon.png';
import { signout } from './Auth';

const Header = ({ onSearch }) => {
  return (
    <header className="sleek-video-header">
      <div className="header-content">
        <div className="left-section">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <div className="logo-container">
              <img className="logo" src={logo} alt="LOGO" />
              <h1 className="heading">Deepfake Detector</h1>
            </div>
          </Link>

        </div>      
      </div>
    </header>
  );
};

export default Header;