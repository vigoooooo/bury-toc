import React, { useEffect } from 'react';
import './Notification.css';

const Notification = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    if (type === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        {message}
      </div>
      {type !== 'success' && (
        <button className="notification-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

export default Notification;