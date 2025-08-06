import { useState } from 'react';
import '../styles/components/completeProfileModal.css';

function CompleteProfileModal({ user, onComplete, onCancel }) {
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones
    if (!name.trim()) {
      setError('El nombre es requerido');
      setLoading(false);
      return;
    }

    if (!phone.trim()) {
      setError('El número de teléfono es requerido');
      setLoading(false);
      return;
    }

    // Validar formato de teléfono
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError('Por favor ingresa un número de teléfono válido');
      setLoading(false);
      return;
    }

    try {
      await onComplete({ name: name.trim(), phone: phone.trim() });
    } catch (err) {
      setError(err.message || 'Error al completar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complete-profile-modal-overlay">
      <div className="complete-profile-modal">
        <div className="modal-header">
          <h2>Completar Perfil</h2>
          <p>Necesitamos algunos datos adicionales para completar tu registro</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre completo:</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Número de teléfono:</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: +54 9 11 1234-5678"
              pattern="[\+]?[0-9\s\-\(\)]{8,15}"
              title="Ingresa un número de teléfono válido (8-15 dígitos)"
              required
              disabled={loading}
            />
          </div>

          {error && <p className="error">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Completando...' : 'Completar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfileModal; 