import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 1. Added Link here
import logo from './assets/logo.png';
import Search_icon from './assets/search_icon.png';
import { signout } from './Auth';

const Header = ({ onSearch }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const navigate = useNavigate(); 

  useEffect(() => {
    const token = localStorage.getItem('authToken'); 
    setIsLoggedIn(!!token); 
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (typeof onSearch === 'function') {
      onSearch(query);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchQuery('');
      if (typeof onSearch === 'function') {
        onSearch('');
      }
    }
  };

  const handleLogout = () => {
    try {
      signout();
      localStorage.removeItem('authToken'); 
      setIsLoggedIn(false); 
      navigate('/'); 
      window.location.reload(); 
    } catch (error) {
      alert('Error', 'Failed to sign out'); 
    }
  };

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
        <div className="auth-buttons">
          {!isLoggedIn ? (
            <>
              <button className="login-btn" onClick={() => navigate('/login')}>
                Login
              </button>
              <button className="signup-btn" onClick={() => navigate('/signup')}>
                Signup
              </button>
            </>
          ) : (
            <>
              <button className="profile-btn" onClick={() => navigate('/profile')}>
                Profile
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
        <div className="search-container">
          {!isSearchOpen ? (
            <button className="search-icon" onClick={toggleSearch}>
              <img className="Search_icon" src={Search_icon} alt="Search Icon" />
            </button>
          ) : (
            <>
              <input
                type="text"
                className="search-input"
                placeholder="Search for features..."
                value={searchQuery}
                onChange={handleSearch}
              />
              <button className="clear-btn" onClick={toggleSearch}>×</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;