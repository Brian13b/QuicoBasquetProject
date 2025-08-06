import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { reservaService } from '../../api/reservaService'
import { canchaService } from '../../api/canchaService'
import { authService } from '../../api/authService'
import { suscripcionService } from '../../api/suscripcionService'
import AdminHeader from './AdminHeader'
import AdminNavigation from './AdminNavigation'
import AdminDashboard from './AdminDashboard'
import AdminReservations from './AdminReservations'
import AdminUsers from './AdminUsers'
import AdminRevenue from './AdminRevenue'
import AdminNotifications from './AdminNotifications'
import AdminPricing from './AdminPricing'
import '../../styles/pages/admin.css'

function AdminLayout() {
  const { currentUser, logout, token } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalReservas: 0,
    reservasHoy: 0,
    ingresosHoy: 0,
    ingresosMes: 0,
    usuariosActivos: 0
  })
  const [reservas, setReservas] = useState([])
  const [canchas, setCanchas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [filtros, setFiltros] = useState({
    fecha: '',
    usuarioEspecifico: '',
    cancha: 'todas',
    estado: 'todas',
    metodoPago: 'todos',
    // Filtros para la sección de usuarios
    nombreUsuario: '',
    rolUsuario: 'todos',
    estadoUsuario: 'todos'
  })

  // Función para cargar datos
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Cargar datos en paralelo
      const [reservasData, canchasData, usuariosData] = await Promise.all([
        reservaService.obtenerTodasLasReservas(filtros.fecha || null),
        canchaService.getCanchas(),
        authService.getAllUsers(token)
      ])

      setReservas(reservasData || [])
      setCanchas(canchasData || [])
      setUsuarios(usuariosData || [])

      // Calcular estadísticas
      const hoy = new Date().toISOString().split('T')[0]
      const reservasHoy = (reservasData || []).filter(r => r.fecha === hoy)
      const usuariosActivos = (usuariosData || []).filter(u => u.bloqueado !== 'bloqueado').length

      setStats({
        totalReservas: (reservasData || []).length,
        reservasHoy: reservasHoy.length,
        ingresosHoy: reservasHoy.reduce((sum, r) => sum + (r.precio || 0), 0),
        ingresosMes: (reservasData || [])
          .filter(r => r.fecha && r.fecha.startsWith(hoy.substring(0, 7)))
          .reduce((sum, r) => sum + (r.precio || 0), 0),
        usuariosActivos
      })
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError('Error al cargar los datos del panel de administración')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!currentUser?.rol || currentUser.rol !== "admin") return
    
    // Inicializar filtro de fecha con hoy
    const hoy = new Date().toISOString().split('T')[0]
    setFiltros(prev => ({...prev, fecha: hoy}))
    
    fetchData()
  }, [currentUser, token])

  // Efecto para recargar datos cuando cambien los filtros
  useEffect(() => {
    if (!currentUser?.rol || currentUser.rol !== "admin") return
    
    // Solo recargar si ya tenemos datos iniciales
    if (reservas.length > 0 || canchas.length > 0) {
      fetchData()
    }
  }, [filtros.fecha])

  // Si no es admin, mostrar mensaje de acceso denegado
  if (!currentUser?.rol || currentUser.rol !== "admin") {
    return (
      <div className="admin-container">
        <div className="unauthorized">
          <h2>🚫 Acceso Denegado</h2>
          <p>No tienes permisos para acceder a esta página.</p>
          <button onClick={() => window.history.back()}>Volver</button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <AdminHeader logout={logout} setActiveTab={setActiveTab} />
      
      <AdminNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="admin-content">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando panel de administración...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <h3>❌ Error</h3>
            <p>{error}</p>
            <button onClick={fetchData} className="btn-primary">
              🔄 Reintentar
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <AdminDashboard stats={stats} setActiveTab={setActiveTab} />
            )}

            {activeTab === 'reservas' && (
              <AdminReservations 
                reservas={reservas}
                canchas={canchas}
                usuarios={usuarios}
                filtros={filtros}
                setFiltros={setFiltros}
                token={token}
                fetchData={fetchData}
              />
            )}

            {activeTab === 'ingresos' && (
              <AdminRevenue 
                reservas={reservas}
                filtros={filtros}
                setFiltros={setFiltros}
              />
            )}

            {activeTab === 'usuarios' && (
              <AdminUsers 
                usuarios={usuarios}
                reservas={reservas}
                filtros={filtros}
                setFiltros={setFiltros}
                token={token}
                fetchData={fetchData}
              />
            )}

            {activeTab === 'notificaciones' && (
              <AdminNotifications />
            )}

            {activeTab === 'precios' && (
              <AdminPricing token={token} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default AdminLayout
