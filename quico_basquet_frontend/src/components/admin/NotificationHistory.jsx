import { useState, useEffect } from 'react'
import { getNotificationHistory } from '../../api/authService'

function NotificationHistory() {
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)

  const cargarHistorial = async () => {
    try {
      setLoading(true)
      const data = await getNotificationHistory()
      setHistorial(data)
    } catch (error) {
      console.error('Error cargando historial:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarHistorial()
  }, [])

  const getTipoIcon = (tipo) => {
    const icons = {
      general: '📢',
      mantenimiento: '🔧',
      promocion: '🎉',
      reserva: '🏀',
      suscripcion: '📅'
    }
    return icons[tipo] || '📢'
  }

  const getTipoColor = (tipo) => {
    const colors = {
      general: '#3498db',
      mantenimiento: '#e74c3c',
      promocion: '#f39c12',
      reserva: '#27ae60',
      suscripcion: '#9b59b6'
    }
    return colors[tipo] || '#3498db'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="historial-container">
        <div className="loading-state">
          <p>Cargando historial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="historial-container">
      <div className="historial-header">
        <h2>Historial de Notificaciones</h2>
        <button onClick={cargarHistorial} className="refresh-btn">
          Actualizar
        </button>
      </div>

      {historial.length === 0 ? (
        <div className="empty-state">
          <p>No hay notificaciones en el historial</p>
        </div>
      ) : (
        <div className="historial-list">
          {historial.map((notif) => (
            <div key={notif.id} className="historial-item">
              <div className="notif-header">
                <span className="notif-icon" style={{ color: getTipoColor(notif.tipo) }}>
                  {getTipoIcon(notif.tipo)}
                </span>
                <div className="notif-info">
                  <h3>{notif.asunto}</h3>
                  <p className="notif-meta">
                    <span className="notif-tipo">{notif.tipo}</span>
                    <span className="notif-destinatarios">{notif.destinatarios}</span>
                    <span className="notif-fecha">{formatDate(notif.fecha_envio)}</span>
                  </p>
                </div>
                <div className="notif-stats">
                  <span className={`estado ${notif.estado}`}>
                    {notif.estado === 'enviado' ? 'Enviado' : 'Error'}
                  </span>
                </div>
              </div>
              <div className="notif-details">
                <p className="notif-mensaje">{notif.mensaje}</p>
                <div className="notif-numbers">
                  <span>Enviados: {notif.enviados_exitosos}</span>
                  <span>Fallidos: {notif.enviados_fallidos}</span>
                  <span>Total: {notif.total_destinatarios}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationHistory 