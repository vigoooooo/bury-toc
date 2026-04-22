import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import './TipsSection.css';

const TipsSection = ({ title, children, expanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="tips-section">
      <div className="tips-header" onClick={toggleExpand}>
        <div className="tips-icon"><Icon name="lock" /></div>
        <h3>{title}</h3>
        <div className={`tips-toggle ${isExpanded ? 'expanded' : ''}`}>
          <span></span>
          <span></span>
        </div>
      </div>
      {isExpanded && (
        <div className="tips-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default TipsSection;