import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { suscripcionService } from '../api/suscripcionService';
import { useNavigate } from 'react-router-dom';
import '../styles/components/mySubscriptions.css';

function MySubscriptions() {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (currentUser && token) {
      fetchSuscripciones();
    }
  }, [currentUser, token]);

  const fetchSuscripciones = async () => {
    setLoading(true);
    try {
      const data = await suscripcionService.obtenerMisSuscripciones();
      setSuscripciones(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las suscripciones');
      console.error('Error al cargar suscripciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSuscripcion = async (suscripcionId) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta suscripción?')) {
      return;
    }

    try {
      await suscripcionService.cancelarSuscripcion(suscripcionId);
      setSuccess('Suscripción cancelada exitosamente');
      
      // Actualizar la lista de suscripciones
      setSuscripciones(prevSuscripciones => 
        prevSuscripciones.map(suscripcion => 
          suscripcion.id === suscripcionId 
            ? { ...suscripcion, estado: 'cancelada' }
            : suscripcion
        )
      );

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Error al cancelar la suscripción');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDate = (dateStr) => {
    // Usar formateo manual para evitar problemas de zona horaria
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5);
  };

  const getDiaSemana = (dia) => {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return dias[dia] || 'Desconocido';
  };

  const getStatusBadge = (estado) => {
    const statusClasses = {
      'activa': 'status-active',
      'cancelada': 'status-cancelled',
      'vencida': 'status-expired',
      'pendiente': 'status-pending'
    };
    
    const statusLabels = {
      'activa': 'Activa',
      'cancelada': 'Cancelada',
      'vencida': 'Vencida',
      'pendiente': 'Pendiente'
    };

    return (
      <span className={`status-badge ${statusClasses[estado] || 'status-pending'}`}>
        {statusLabels[estado] || estado}
      </span>
    );
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'activa':
        return '✅';
      case 'cancelada':
        return '❌';
      case 'vencida':
        return '⏰';
      case 'pendiente':
        return '⏳';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="my-subscriptions-container">
        <h2>Mis Suscripciones</h2>
        <p>Cargando suscripciones...</p>
      </div>
    );
  }

  const suscripcionesActivas = suscripciones.filter(s => s.estado === 'activa');
  const suscripcionesCanceladas = suscripciones.filter(s => s.estado === 'cancelada');
  const suscripcionesVencidas = suscripciones.filter(s => s.estado === 'vencida');

  return (
    <div className="my-subscriptions-container">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Volver al Inicio
        </button>
        <h2>Mis Suscripciones</h2>
      </div>
      
      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {/* Suscripciones Activas */}
      <div className="subscriptions-section">
        <h3>
          {getStatusIcon('activa')} Suscripciones Activas ({suscripcionesActivas.length})
        </h3>
        {suscripcionesActivas.length === 0 ? (
          <p className="no-subscriptions">No tienes suscripciones activas</p>
        ) : (
          <div className="subscriptions-grid">
            {suscripcionesActivas.map((suscripcion) => (
              <div key={suscripcion.id} className="subscription-card active">
                <div className="subscription-header">
                  <h4>{suscripcion.cancha?.nombre || 'Cancha'}</h4>
                  {getStatusBadge(suscripcion.estado)}
                </div>
                
                <div className="subscription-details">
                  <p><strong>Deporte:</strong> {suscripcion.deporte}</p>
                  <p><strong>Día:</strong> {getDiaSemana(suscripcion.dia_semana)}</p>
                  <p><strong>Horario:</strong> {formatTime(suscripcion.hora_inicio)} - {formatTime(suscripcion.hora_fin)}</p>
                  <p><strong>Desde:</strong> {formatDate(suscripcion.fecha_inicio)}</p>
                  <p><strong>Hasta:</strong> {formatDate(suscripcion.fecha_fin)}</p>
                  <p><strong>Precio mensual:</strong> ${suscripcion.precio_mensual}</p>
                  <p><strong>Método de pago:</strong> {suscripcion.metodo_pago}</p>
                </div>

                <div className="subscription-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancelSuscripcion(suscripcion.id)}
                  >
                    Cancelar Suscripción
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suscripciones Vencidas */}
      {suscripcionesVencidas.length > 0 && (
        <div className="subscriptions-section">
          <h3>
            {getStatusIcon('vencida')} Suscripciones Vencidas ({suscripcionesVencidas.length})
          </h3>
          <div className="subscriptions-grid">
            {suscripcionesVencidas.map((suscripcion) => (
              <div key={suscripcion.id} className="subscription-card expired">
                <div className="subscription-header">
                  <h4>{suscripcion.cancha?.nombre || 'Cancha'}</h4>
                  {getStatusBadge(suscripcion.estado)}
                </div>
                
                <div className="subscription-details">
                  <p><strong>Deporte:</strong> {suscripcion.deporte}</p>
                  <p><strong>Día:</strong> {getDiaSemana(suscripcion.dia_semana)}</p>
                  <p><strong>Horario:</strong> {formatTime(suscripcion.hora_inicio)} - {formatTime(suscripcion.hora_fin)}</p>
                  <p><strong>Desde:</strong> {formatDate(suscripcion.fecha_inicio)}</p>
                  <p><strong>Hasta:</strong> {formatDate(suscripcion.fecha_fin)}</p>
                  <p><strong>Precio mensual:</strong> ${suscripcion.precio_mensual}</p>
                </div>

                <div className="subscription-actions">
                  <button className="btn-renew">
                    Renovar Suscripción
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suscripciones Canceladas */}
      {suscripcionesCanceladas.length > 0 && (
        <div className="subscriptions-section">
          <h3>
            {getStatusIcon('cancelada')} Suscripciones Canceladas ({suscripcionesCanceladas.length})
          </h3>
          <div className="subscriptions-grid">
            {suscripcionesCanceladas.map((suscripcion) => (
              <div key={suscripcion.id} className="subscription-card cancelled">
                <div className="subscription-header">
                  <h4>{suscripcion.cancha?.nombre || 'Cancha'}</h4>
                  {getStatusBadge(suscripcion.estado)}
                </div>
                
                <div className="subscription-details">
                  <p><strong>Deporte:</strong> {suscripcion.deporte}</p>
                  <p><strong>Día:</strong> {getDiaSemana(suscripcion.dia_semana)}</p>
                  <p><strong>Horario:</strong> {formatTime(suscripcion.hora_inicio)} - {formatTime(suscripcion.hora_fin)}</p>
                  <p><strong>Desde:</strong> {formatDate(suscripcion.fecha_inicio)}</p>
                  <p><strong>Hasta:</strong> {formatDate(suscripcion.fecha_fin)}</p>
                  <p><strong>Precio mensual:</strong> ${suscripcion.precio_mensual}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MySubscriptions; 