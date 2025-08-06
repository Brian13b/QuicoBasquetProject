import { useEffect } from 'react';
import '../styles/components/AlertModal.css';

function AlertModal({ 
  isOpen, 
  type = 'error', 
  title, 
  message, 
  onClose, 
  autoClose = true,
  autoCloseTime = 5000 
}) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseTime, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'error':
        return 'Error';
      case 'warning':
        return 'Advertencia';
      case 'success':
        return 'Éxito';
      case 'info':
        return 'Información';
      default:
        return 'Mensaje';
    }
  };

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className={`alert-modal ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="alert-header">
          <div className="alert-icon">{getIcon()}</div>
          <h3 className="alert-title">{getTitle()}</h3>
          <button className="alert-close" onClick={onClose}>×</button>
        </div>
        
        <div className="alert-content">
          <p className="alert-message">{message}</p>
        </div>
        
        <div className="alert-footer">
          <button className="alert-btn" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal; 