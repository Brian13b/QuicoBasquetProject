import PropTypes from 'prop-types'

function AdminNavigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'reservas', icon: '📅', label: 'Reservas' },
    { id: 'ingresos', icon: '💰', label: 'Ingresos' },
    { id: 'usuarios', icon: '👥', label: 'Usuarios' },
    { id: 'precios', icon: '💵', label: 'Precios' },
    { id: 'notificaciones', icon: '🔔', label: 'Notificaciones' }
  ]

  return (
    <nav className="admin-nav">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          type="button"
          className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </nav>
  )
}

AdminNavigation.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired
}

export default AdminNavigation
