import PropTypes from 'prop-types'

function AdminDashboard({ stats, setActiveTab }) {
  const handleCardClick = (tabId) => {
    setActiveTab(tabId)
  }

  return (
    <div className="dashboard-tab">
      {/* Navegación rápida */}
      <div className="quick-navigation">
        <h3>Navegación Rápida</h3>
        <div className="nav-buttons-grid">
          <button 
            className="nav-btn"
            onClick={() => handleCardClick('reservas')}
          >
            📅 Reservas
          </button>
          
          <button 
            className="nav-btn"
            onClick={() => handleCardClick('ingresos')}
          >
            💰 Ingresos
          </button>
          
          <button 
            className="nav-btn"
            onClick={() => handleCardClick('usuarios')}
          >
            👥 Usuarios
          </button>
          
          <button 
            className="nav-btn"
            onClick={() => handleCardClick('precios')}
          >
            💵 Precios
          </button>
          
          <button 
            className="nav-btn"
            onClick={() => handleCardClick('notificaciones')}
          >
            🔔 Notificaciones
          </button>
        </div>
      </div>

      {/* Cards de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>{stats.reservasHoy}</h3>
            <p>Reservas Hoy</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <h3>${stats.ingresosHoy.toLocaleString()}</h3>
            <p>Ingresos Hoy</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>${stats.ingresosMes.toLocaleString()}</h3>
            <p>Ingresos del Mes</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.usuariosActivos}</h3>
            <p>Usuarios Activos</p>
          </div>
        </div>
      </div>
    </div>
  )
}

AdminDashboard.propTypes = {
  stats: PropTypes.shape({
    reservasHoy: PropTypes.number.isRequired,
    ingresosHoy: PropTypes.number.isRequired,
    ingresosMes: PropTypes.number.isRequired,
    usuariosActivos: PropTypes.number.isRequired
  }).isRequired,
  setActiveTab: PropTypes.func.isRequired
}

export default AdminDashboard
