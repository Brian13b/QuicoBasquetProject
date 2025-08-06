import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reservaService } from '../api/reservaService';
import { suscripcionService } from '../api/suscripcionService';
import '../styles/components/myReservations.css';

function MyReservations() {
  const { currentUser, token } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('reservas');

  useEffect(() => {
    if (currentUser) {
      cargarDatos();
    }
  }, [currentUser]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar reservas y suscripciones en paralelo
      const [reservasData, suscripcionesData] = await Promise.all([
        reservaService.obtenerMisReservas(),
        suscripcionService.obtenerMisSuscripciones()
      ]);

      setReservas(reservasData);
      setSuscripciones(suscripcionesData);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (reservaId) => {
    try {
      await reservaService.cancelarReserva(reservaId);
      setReservas(reservas.filter(r => r.id !== reservaId));
    } catch (err) {
      setError('Error al cancelar la reserva');
    }
  };

  const cancelarSuscripcion = async (suscripcionId) => {
    try {
      await suscripcionService.cancelarSuscripcion(suscripcionId);
      setSuscripciones(suscripciones.filter(s => s.id !== suscripcionId));
    } catch (err) {
      setError('Error al cancelar la suscripción');
    }
  };

  const formatDate = (dateString) => {
    // Usar formateo manual para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    
    return fecha.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  // Función para verificar si una reserva ya pasó
  const isReservaPasada = (reserva) => {
    const ahora = new Date();
    // Crear fecha de reserva usando la fecha y hora de fin
    const [year, month, day] = reserva.fecha.split('-').map(Number);
    const [hour, minute] = reserva.hora_fin.split(':').map(Number);
    const fechaReserva = new Date(year, month - 1, day, hour, minute);
    
    console.log('🔍 Comparando fechas:', {
      reserva: reserva.fecha + ' ' + reserva.hora_fin,
      fechaReserva: fechaReserva.toLocaleString(),
      ahora: ahora.toLocaleString(),
      esPasada: fechaReserva < ahora
    });
    
    return fechaReserva < ahora;
  };

  // Separar reservas en futuras e inactivas (pasadas o canceladas)
  const reservasFuturas = reservas.filter(reserva => 
    !isReservaPasada(reserva) && reserva.estado !== 'cancelada'
  );
  const reservasInactivas = reservas.filter(reserva => 
    isReservaPasada(reserva) || reserva.estado === 'cancelada'
  );

  // Función para ordenar reservas por fecha y hora
  const ordenarReservas = (reservas) => {
    return reservas.sort((a, b) => {
      const fechaA = new Date(a.fecha + 'T' + a.hora_inicio);
      const fechaB = new Date(b.fecha + 'T' + b.hora_inicio);
      return fechaA - fechaB;
    });
  };

  // Ordenar las listas
  const reservasFuturasOrdenadas = ordenarReservas(reservasFuturas);
  const reservasInactivasOrdenadas = ordenarReservas(reservasInactivas);

  const getStatusBadge = (estado) => {
    const statusClasses = {
      'confirmada': 'status-confirmed',
      'cancelada': 'status-cancelled',
      'completada': 'status-completed',
      'activa': 'status-active',
      'vencida': 'status-expired',
      'pendiente': 'status-pending'
    };

    return (
      <span className={`status-badge ${statusClasses[estado] || 'status-default'}`}>
        {estado}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="my-reservations-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="my-reservations-container">
      <div className="page-header">
        <button 
          className="btn-back"
          onClick={() => window.history.back()}
        >
          ← Volver
        </button>
        <h2>Mis Reservas y Suscripciones</h2>
      </div>

      {error && <div className="alert error">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'reservas' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservas')}
        >
          Reservas Futuras ({reservasFuturasOrdenadas.length})
        </button>
        <button 
          className={`tab ${activeTab === 'reservas-inactivas' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservas-inactivas')}
        >
          Reservas Inactivas ({reservasInactivasOrdenadas.length})
        </button>
        <button 
          className={`tab ${activeTab === 'suscripciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('suscripciones')}
        >
          Suscripciones ({suscripciones.length})
        </button>
      </div>

      {/* Contenido de Reservas Futuras */}
      {activeTab === 'reservas' && (
        <div className="reservas-section">
          {reservasFuturasOrdenadas.length === 0 ? (
            <div className="no-items">
              <p>No tienes reservas futuras</p>
            </div>
          ) : (
            <div className="reservas-grid">
              {reservasFuturasOrdenadas.map(reserva => (
                <div key={reserva.id} className={`reserva-card ${reserva.estado}`}>
                  <div className="card-header">
                    <h3>{reserva.cancha_nombre}</h3>
                    {getStatusBadge(reserva.estado)}
                  </div>
                  
                  <div className="card-details">
                    <p><strong>Deporte:</strong> {reserva.deporte}</p>
                    <p><strong>Fecha:</strong> {formatDate(reserva.fecha)}</p>
                    <p><strong>Horario:</strong> {formatTime(reserva.hora_inicio)} - {formatTime(reserva.hora_fin)}</p>
                    <p><strong>Precio:</strong> ${reserva.precio?.toLocaleString()}</p>
                    <p><strong>Método de pago:</strong> {reserva.metodo_pago}</p>
                  </div>

                  {reserva.estado === 'confirmada' && (
                    <div className="card-actions">
                      <button 
                        className="btn-cancel"
                        onClick={() => cancelarReserva(reserva.id)}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenido de Reservas Inactivas */}
      {activeTab === 'reservas-inactivas' && (
        <div className="reservas-section">
          {reservasInactivasOrdenadas.length === 0 ? (
            <div className="no-items">
              <p>No tienes reservas inactivas</p>
            </div>
          ) : (
            <div className="reservas-grid">
              {reservasInactivasOrdenadas.map(reserva => (
                <div key={reserva.id} className={`reserva-card ${reserva.estado} ${isReservaPasada(reserva) ? 'pasada' : ''}`}>
                  <div className="card-header">
                    <h3>{reserva.cancha_nombre}</h3>
                    {getStatusBadge(reserva.estado)}
                  </div>
                  
                  <div className="card-details">
                    <p><strong>Deporte:</strong> {reserva.deporte}</p>
                    <p><strong>Fecha:</strong> {formatDate(reserva.fecha)}</p>
                    <p><strong>Horario:</strong> {formatTime(reserva.hora_inicio)} - {formatTime(reserva.hora_fin)}</p>
                    <p><strong>Precio:</strong> ${reserva.precio?.toLocaleString()}</p>
                    <p><strong>Método de pago:</strong> {reserva.metodo_pago}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenido de Suscripciones */}
      {activeTab === 'suscripciones' && (
        <div className="suscripciones-section">
          {suscripciones.length === 0 ? (
            <div className="no-items">
              <p>No tienes suscripciones activas</p>
            </div>
          ) : (
            <div className="suscripciones-grid">
              {suscripciones.map(suscripcion => (
                <div key={suscripcion.id} className={`suscripcion-card ${suscripcion.estado}`}>
                  <div className="card-header">
                    <h3>{suscripcion.cancha_nombre}</h3>
                    <div className="header-badges">
                      {getStatusBadge(suscripcion.estado)}
                      <span className="badge-subscription">Suscripción</span>
                    </div>
                  </div>
                  
                  <div className="card-details">
                    <p><strong>Deporte:</strong> {suscripcion.deporte}</p>
                    <p><strong>Día:</strong> {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][suscripcion.dia_semana]}</p>
                    <p><strong>Horario:</strong> {formatTime(suscripcion.hora_inicio)} - {formatTime(suscripcion.hora_fin)}</p>
                    <p><strong>Inicio:</strong> {formatDate(suscripcion.fecha_inicio)}</p>
                    {suscripcion.fecha_fin && (
                      <p><strong>Fin:</strong> {formatDate(suscripcion.fecha_fin)}</p>
                    )}
                    <p><strong>Precio mensual:</strong> ${suscripcion.precio_mensual?.toLocaleString()}</p>
                    <p><strong>Método de pago:</strong> {suscripcion.metodo_pago}</p>
                  </div>

                  {suscripcion.estado === 'activa' && (
                    <div className="card-actions">
                      <button 
                        className="btn-cancel"
                        onClick={() => cancelarSuscripcion(suscripcion.id)}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MyReservations; 