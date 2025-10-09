import React, { useEffect, useState } from 'react';

export default function Toast({ 
  message, 
  type = 'info', 
  onClose, 
  duration = 5000,
  position = 'top-right',
  showClose = true,
  pauseOnHover = true
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      setIsLeaving(false);

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [message, duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Match CSS transition duration
  };

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      // Pause auto-close when hovering
      document.querySelectorAll(`.toast-${type}`).forEach(toast => {
        toast.style.animationPlayState = 'paused';
      });
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      // Resume auto-close when not hovering
      document.querySelectorAll(`.toast-${type}`).forEach(toast => {
        toast.style.animationPlayState = 'running';
      });
    }
  };

  if (!message || !isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '💡';
    }
  };

  return (
    <div 
      className={`toast toast-${type} toast-${position} ${isLeaving ? 'toast-leaving' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-content">
        <div className="toast-title">
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
        <div className="toast-body">{message}</div>
      </div>
      {showClose && (
        <button 
          className="toast-close" 
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      )}
      {duration > 0 && (
        <div 
          className="toast-progress" 
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
}