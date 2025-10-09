import React, { useEffect, useRef } from 'react';

export default function ConfirmModal({ 
  open, 
  title = 'Confirm Action', 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  onConfirm, 
  onCancel,
  showCloseButton = true,
  closeOnBackdrop = true,
  size = 'md'
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onCancel?.();
      }
    };

    const handleClickOutside = (e) => {
      if (closeOnBackdrop && modalRef.current && !modalRef.current.contains(e.target)) {
        onCancel?.();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [open, onCancel, closeOnBackdrop]);

  if (!open) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '🔴';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return '💡';
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn-danger';
      case 'warning':
        return 'btn-warning';
      case 'success':
        return 'btn-success';
      case 'info':
        return 'btn-primary';
      default:
        return 'btn-primary';
    }
  };

  return (
    <div className="modal-backdrop">
      <div 
        ref={modalRef}
        className={`modal modal-${size} modal-${type}`}
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <span className="modal-icon">{getIcon()}</span>
            <div>
              <h3 id="modal-title" className="modal-title">{title}</h3>
              {type === 'danger' && <div className="modal-subtitle">This action cannot be undone</div>}
            </div>
          </div>
          {showCloseButton && (
            <button 
              className="modal-close"
              onClick={onCancel}
              aria-label="Close modal"
            >
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body">
          <p id="modal-description" className="modal-message">{message}</p>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button 
            className="btn btn-outline"
            onClick={onCancel}
            autoFocus
          >
            {cancelText}
          </button>
          <button 
            className={`btn ${getConfirmButtonClass()}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}