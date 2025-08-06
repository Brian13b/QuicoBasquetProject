import { useState, useEffect } from 'react'
import { getNotificationStats } from '../../api/authService'

function NotificationStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const cargarEstadisticas = async () => {
    try {
      setLoading(true)
      const data = await getNotificationStats()
      setStats(data)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarEstadisticas()
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
      <div className="stats-container">
        <div className="loading-state">
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="stats-container">
        <div className="empty-state">
          <p>Error al cargar las estadísticas</p>
        </div>
      </div>
    )
  }

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h2>Estadísticas de Notificaciones</h2>
        <button onClick={cargarEstadisticas} className="refresh-btn">
          Actualizar
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📧</div>
          <div className="stat-content">
            <h3>{stats.total_notificaciones || 0}</h3>
            <p>Total Notificaciones</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.total_enviados || 0}</h3>
            <p>Enviados Exitosos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{stats.total_fallidos || 0}</h3>
            <p>Enviados Fallidos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{stats.tasa_exito ? stats.tasa_exito.toFixed(1) : '0.0'}%</h3>
            <p>Tasa de Éxito</p>
          </div>
        </div>
      </div>

      <div className="stats-details">
        <div className="stats-section">
          <h3>Notificaciones por Tipo</h3>
          <div className="tipo-stats">
            {stats.por_tipo && Object.keys(stats.por_tipo).length > 0 ? (
              Object.entries(stats.por_tipo).map(([tipo, cantidad]) => (
                <div key={tipo} className="tipo-stat">
                  <span className="tipo-icon" style={{ color: getTipoColor(tipo) }}>
                    {getTipoIcon(tipo)}
                  </span>
                  <span className="tipo-nombre">{tipo}</span>
                  <span className="tipo-cantidad">{cantidad}</span>
                </div>
              ))
            ) : (
              <p>No hay datos disponibles</p>
            )}
          </div>
        </div>

        <div className="stats-section">
          <h3>Últimas Notificaciones</h3>
          <div className="ultimas-notificaciones">
            {stats.ultimas_notificaciones && stats.ultimas_notificaciones.length > 0 ? (
              stats.ultimas_notificaciones.map((notif) => (
                <div key={notif.id} className="ultima-notif">
                  <span className="notif-icon" style={{ color: getTipoColor(notif.tipo) }}>
                    {getTipoIcon(notif.tipo)}
                  </span>
                  <div className="notif-info">
                    <p className="notif-asunto">{notif.asunto}</p>
                    <p className="notif-fecha">{formatDate(notif.fecha_envio)}</p>
                  </div>
                  <span className="notif-enviados">
                    {notif.enviados_exitosos} enviados
                  </span>
                </div>
              ))
            ) : (
              <p>No hay notificaciones recientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationStats 