import PropTypes from 'prop-types'

function AdminHeader({ logout, setActiveTab }) {
  return (
    <header className="admin-header">
      <div className="header-left">
        <button 
          className="btn-back" 
          onClick={() => window.history.back()}
          title="Volver atrás"
        >
          ← Volver
        </button>
        <h1>Panel de Administración</h1>
      </div>
      <div className="header-right">
        <button 
          className="btn-secondary" 
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button className="btn-logout" onClick={logout}>
          Cerrar Sesión
        </button>
      </div>
    </header>
  )
}

AdminHeader.propTypes = {
  logout: PropTypes.func.isRequired,
  setActiveTab: PropTypes.func.isRequired
}

export default AdminHeader
