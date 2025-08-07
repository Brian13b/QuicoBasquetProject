import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { authService } from '../../api/authService'

function AdminUsers({ 
  usuarios, 
  reservas, 
  filtros, 
  setFiltros, 
  token, 
  fetchData 
}) {
  
  // Filtrar usuarios según filtros activos
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(usuario => {
      let coincideNombre = true;
      if (filtros.nombreUsuario && filtros.nombreUsuario.trim() !== '') {
        const busqueda = filtros.nombreUsuario.toLowerCase().trim();
        const nombreUsuario = usuario.nombre?.toLowerCase() || '';
        const emailUsuario = usuario.email?.toLowerCase() || '';
        
        coincideNombre = nombreUsuario.includes(busqueda) || emailUsuario.includes(busqueda);
      }
      
      const coincideRol = filtros.rolUsuario === 'todos' || usuario.rol === filtros.rolUsuario;
      const estadoUsuario = usuario.bloqueado || 'activo';
      const coincideEstado = filtros.estadoUsuario === 'todos' || estadoUsuario === filtros.estadoUsuario;

      return coincideNombre && coincideRol && coincideEstado;
    });
  }, [usuarios, filtros])

  const bloquearUsuario = async (userId, bloqueado) => {
    try {
      await authService.bloquearUsuario(userId, bloqueado, token)
      fetchData() 
    } catch (error) {
      console.error('Error al bloquear usuario:', error)
      alert('Error al bloquear/desbloquear usuario')
    }
  }

  const enviarNotificacion = async (usuarioId, mensaje) => {
    try {
      const notificationData = {
        destinatarios: "especifico",
        usuario_id_especifico: usuarioId,
        asunto: "Notificación del Administrador",
        mensaje: mensaje,
        tipo: "general"
      }
      
      await authService.sendNotification(notificationData, token)
      alert('Notificación por email enviada exitosamente')
    } catch (error) {
      console.error('Error al enviar notificación:', error)
      alert('Error al enviar la notificación por email')
    }
  }

  const limpiarFiltros = () => {
    setFiltros(prev => ({
      ...prev,
      nombreUsuario: '',
      rolUsuario: 'todos',
      estadoUsuario: 'todos'
    }))
  }

  const estadisticasUsuarios = useMemo(() => {
    const activos = usuarios.filter(u => u.bloqueado !== 'bloqueado').length
    const bloqueados = usuarios.filter(u => u.bloqueado === 'bloqueado').length
    const admins = usuarios.filter(u => u.rol === 'admin').length
    const users = usuarios.filter(u => u.rol === 'user').length
    
    return { activos, bloqueados, admins, users, total: usuarios.length }
  }, [usuarios])

  return (
    <div className="usuarios-tab">
      {/* Estadísticas de usuarios */}
      <div className="usuarios-stats">
        <h3>Estadísticas de Usuarios</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h4>Total</h4>
              <p>{estadisticasUsuarios.total}</p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h4>Activos</h4>
              <p>{estadisticasUsuarios.activos}</p>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">🔒</div>
            <div className="stat-content">
              <h4>Bloqueados</h4>
              <p>{estadisticasUsuarios.bloqueados}</p>
            </div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">👨‍💼</div>
            <div className="stat-content">
              <h4>Administradores</h4>
              <p>{estadisticasUsuarios.admins}</p>
            </div>
          </div>
        </div>
      </div>
    
      {/* Filtros */}
      <div className="filtros-section">
        <div className="filtros-header">
          <h3>Filtros de Usuarios</h3>
          <button 
            className="btn-secondary btn-small"
            onClick={limpiarFiltros}
            title="Limpiar filtros de usuarios"
          >
            Limpiar
          </button>
        </div>
        <div className="filtros-grid">
          <div className="filtro-item">
            <label>Buscar Usuario:</label>
            <input 
              type="text" 
              value={filtros.nombreUsuario}
              onChange={(e) => setFiltros(prev => ({...prev, nombreUsuario: e.target.value}))}
              placeholder="Nombre o email del usuario..."
            />
          </div>

          <div className="filtro-item">
            <label>Rol:</label>
            <select 
              value={filtros.rolUsuario}
              onChange={(e) => setFiltros(prev => ({...prev, rolUsuario: e.target.value}))}
            >
              <option value="todos">Todos los roles</option>
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          
          <div className="filtro-item">
            <label>Estado:</label>
            <select 
              value={filtros.estadoUsuario}
              onChange={(e) => setFiltros(prev => ({...prev, estadoUsuario: e.target.value}))}
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="bloqueado">Bloqueados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="usuarios-table">
        <h3>👥 Usuarios Registrados ({usuariosFiltrados.length})</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Reservas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario) => {
                const reservasUsuario = reservas.filter(r => r.user_id === usuario.id)
                return (
                  <tr key={usuario.id}>
                    <td>{usuario.id}</td>
                    <td>{usuario.nombre || 'N/A'}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.telefono || 'N/A'}</td>
                    <td>
                      <span className={`badge ${usuario.rol}`}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${usuario.bloqueado || 'activo'}`}>
                        {usuario.bloqueado || 'activo'}
                      </span>
                    </td>
                    <td>
                      <span className="reservas-count">
                        {reservasUsuario.length}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button 
                          className="btn-small btn-info"
                          onClick={() => enviarNotificacion(usuario.id, 'Notificación de prueba desde el panel de administración')}
                          title="Enviar email"
                        >
                          <span className="icon">📧</span>
                        </button>
                        {usuario.rol !== 'admin' && (
                          <button 
                            className={`btn-small ${usuario.bloqueado === 'bloqueado' ? 'btn-success' : 'btn-warning'}`}
                            onClick={() => bloquearUsuario(usuario.id, usuario.bloqueado === 'bloqueado' ? 'activo' : 'bloqueado')}
                            title={usuario.bloqueado === 'bloqueado' ? 'Desbloquear usuario' : 'Bloquear usuario'}
                          >
                            <span className="icon">{usuario.bloqueado === 'bloqueado' ? '🔓' : '🔒'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="8" className="no-data">
                    😔 No se encontraron usuarios con los filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

AdminUsers.propTypes = {
  usuarios: PropTypes.array.isRequired,
  reservas: PropTypes.array.isRequired,
  filtros: PropTypes.object.isRequired,
  setFiltros: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  fetchData: PropTypes.func.isRequired
}

export default AdminUsers
