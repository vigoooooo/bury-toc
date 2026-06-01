import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BottomBar.css';

const BottomBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isVisible, setIsVisible] = useState(true);
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    const checkIsApp = () => {
      if (navigator.userAgent.includes('Capacitor')) {
        setIsApp(true);
        return;
      }
      
      if (window.Capacitor) {
        if (typeof window.Capacitor.isNativePlatform === 'function') {
          setIsApp(window.Capacitor.isNativePlatform());
        } else if (window.Capacitor.platform) {
          setIsApp(true);
        } else {
          setIsApp(true);
        }
      }
      
      if (window.location.protocol === 'capacitor:') {
        setIsApp(true);
        return;
      }
      
      if (navigator.userAgent.includes('iOS') || navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        if (navigator.userAgent.includes('Safari') === false || navigator.userAgent.includes('WKWebView')) {
          setIsApp(true);
          return;
        }
      }
    };

    checkIsApp();

    const handleLoad = () => {
      checkIsApp();
    };

    window.addEventListener('load', handleLoad);
    return () => window.removeEventListener('load', handleLoad);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setIsVisible(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(true);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    {
      id: 'new',
      label: 'New',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      ),
      path: '/new-secret'
    },
    {
      id: 'list',
      label: 'List',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      ),
      path: '/my-secrets'
    },
    {
      id: 'me',
      label: 'Me',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      path: '/profile'
    }
  ];

  const handleNavClick = (path) => {
    if (path !== currentPath) {
      navigate(path, { state: {} });
    } else {
      // 同一页面：强制刷新 state（清除残留的编辑参数等）
      navigate(path, { state: {}, replace: true });
    }
  };

  if (!isApp) {
    return null;
  }

  return (
    <nav className={`bottom-bar ${isVisible ? 'visible' : ''}`}>
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`bottom-bar-item ${currentPath === item.path ? 'active' : ''}`}
          onClick={() => handleNavClick(item.path)}
        >
          <span className="bottom-bar-icon">{item.icon}</span>
          <span className="bottom-bar-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomBar;