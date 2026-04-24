import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { API_BASE_URL, WEB_BASE_URL } from '../config';
import './Header.css';

const Header = ({ showMenu = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoggedIn(false);
        return;
      }
      
      // 验证token的有效性
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/user/get`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setIsLoggedIn(true);
        } else {
          // token无效，清除本地存储
          localStorage.removeItem('token');
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        localStorage.removeItem('token');
        setIsLoggedIn(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/user/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      navigate('/login');
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <a href={WEB_BASE_URL} className="logo">
          <Icon name="lock" className="logo-icon" />
          <span className="logo-text">Buried</span>
        </a>
        {showMenu && (
          <>
            <div className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <div className={`menu-icon ${isMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
              <a 
                href="/new-secret" 
                className={`nav-link ${currentPath === '/new-secret' ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">+</span>
                <span>New Secret</span>
              </a>
              <a 
                href="/my-secrets" 
                className={`nav-link ${currentPath === '/my-secrets' ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </span>
                <span>My Secrets</span>
              </a>
              {isLoggedIn && (
                <>
                  <a 
                    href="/profile" 
                    className={`nav-link ${currentPath === '/profile' ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="nav-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </span>
                    <span>Profile</span>
                  </a>
                  <a 
                    href="#" 
                    className="nav-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <span className="nav-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                    </span>
                    <span>Logout</span>
                  </a>
                </>
              )}
            </nav>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;