import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { reservaService } from '../../api/reservaService'
import { suscripcionService } from '../../api/suscripcionService'
import AlertModal from '../AlertModal'


function AdminReservations({ 
  reservas, 
  canchas, 
  usuarios, 
  filtros, 
  setFiltros, 
  token, 
  fetchData 
}) {
  // Estados para modales y alertas
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [newPrice, setNewPrice] = useState('')
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
    autoClose: true
  })

  // Función para formatear hora
  const formatearHora = (hora) => {
    if (!hora) return 'N/A'
    return hora.substring(0, 5)
  }

  // Función para mostrar alertas
  const showAlert = (type, title, message, autoClose = true) => {
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message,
      autoClose
    })
  }

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }))
  }

  // Filtrar reservas según filtros activos
  const reservasFiltradas = useMemo(() => {
    let reservasFiltradas = reservas.filter(reserva => {
      // 🔍 FILTRO DE FECHA MEJORADO:
      let coincideFecha = true;
      if (filtros.fecha) {
        // Si hay una fecha específica, filtrar solo esa fecha
        coincideFecha = reserva.fecha === filtros.fecha;
      } else if (filtros.usuarioEspecifico && filtros.usuarioEspecifico.trim() !== '') {
        // Si hay búsqueda por usuario SIN fecha específica, mostrar TODAS las reservas del usuario
        coincideFecha = true;
      } else {
        // Si no hay filtros específicos, mostrar desde hoy en adelante
        const hoy = new Date().toISOString().split('T')[0];
        coincideFecha = reserva.fecha >= hoy;
      }
      
      // 🔍 FILTRO DE USUARIO:
      let coincideUsuario = true;
      if (filtros.usuarioEspecifico && filtros.usuarioEspecifico.trim() !== '') {
        const busqueda = filtros.usuarioEspecifico.toLowerCase().trim();
        const usuario = usuarios.find(u => u.id === reserva.user_id);
        const nombreUsuario = usuario?.nombre || '';
        const emailUsuario = usuario?.email || '';
        const nombreCliente = reserva.nombre_cliente || '';
        
        coincideUsuario = nombreUsuario.toLowerCase().includes(busqueda) || 
                         emailUsuario.toLowerCase().includes(busqueda) ||
                         nombreCliente.toLowerCase().includes(busqueda);
      }
      
      const coincideCancha = filtros.cancha === 'todas' || reserva.cancha_id === parseInt(filtros.cancha)
      const coincideEstado = filtros.estado === 'todas' || reserva.estado === filtros.estado
      const coincidePago = filtros.metodoPago === 'todos' || reserva.metodo_pago === filtros.metodoPago

      return coincideFecha && coincideUsuario && coincideCancha && coincideEstado && coincidePago
    });
    
    // 📅 ORDENAR POR FECHA Y HORA (más recientes primero, luego por hora)
    return reservasFiltradas.sort((a, b) => {
      // Primero por fecha (descendente - más recientes primero)
      const fechaComparison = new Date(b.fecha) - new Date(a.fecha);
      if (fechaComparison !== 0) return fechaComparison;
      
      // Si las fechas son iguales, ordenar por hora de inicio (ascendente)
      const horaA = a.hora_inicio || '00:00';
      const horaB = b.hora_inicio || '00:00';
      return horaA.localeCompare(horaB);
    });
  }, [reservas, filtros, usuarios])

  // Función para obtener el tipo de reserva (normal o suscripción)
  const getTipoReserva = (reserva) => {
    return reserva.tipo === 'suscripcion' ? 'suscripcion' : 'reserva';
  };

  // Función para obtener el icono según el tipo
  const getTipoIcon = (reserva) => {
    return reserva.tipo === 'suscripcion' ? '🔄' : '📅';
  };

  // Función para obtener el color de fondo según el tipo
  const getTipoColor = (reserva) => {
    return reserva.tipo === 'suscripcion' ? '#e3f2fd' : '#f8f9fa';
  };

  // Funciones para reservas normales
  const cambiarEstadoReserva = async (reservaId, nuevoEstado) => {
    try {
      await reservaService.actualizarEstadoReserva(reservaId, nuevoEstado)
      showAlert('success', 'Estado Actualizado', `Reserva ${nuevoEstado} exitosamente`)
      fetchData() 
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      showAlert('error', 'Error', 'Error al cambiar el estado de la reserva')
    }
  }

  const cambiarEstadoPagoReserva = async (reservaId, nuevoEstadoPago) => {
    try {
      await reservaService.actualizarEstadoPagoReserva(reservaId, nuevoEstadoPago)
      showAlert('success', 'Pago Actualizado', `Estado de pago ${nuevoEstadoPago} exitosamente`)
      fetchData()
    } catch (error) {
      console.error('Error al cambiar estado de pago:', error)
      showAlert('error', 'Error', 'Error al cambiar el estado de pago de la reserva')
    }
  }

  const cambiarPrecioReserva = async (reservaId, nuevoPrecio) => {
    try {
      await reservaService.actualizarPrecioReserva(reservaId, nuevoPrecio)
      showAlert('success', 'Precio Actualizado', `Precio actualizado a $${nuevoPrecio} exitosamente`)
      setShowPriceModal(false)
      setSelectedItem(null)
      setNewPrice('')
      fetchData()
    } catch (error) {
      console.error('Error al cambiar precio:', error)
      showAlert('error', 'Error', 'Error al cambiar el precio de la reserva')
    }
  }

  // Funciones para suscripciones
  const actualizarDescuentoSuscripcion = async (suscripcionId, nuevoDescuento) => {
    try {
      await suscripcionService.actualizarDescuentoSuscripcion(suscripcionId, nuevoDescuento)
      showAlert('success', 'Descuento Actualizado', `Descuento actualizado a ${nuevoDescuento}% exitosamente`)
      fetchData()
    } catch (error) {
      console.error('Error al actualizar descuento de suscripción:', error)
      showAlert('error', 'Error', 'Error al actualizar el descuento de la suscripción')
    }
  }

  const cambiarEstadoPagoSuscripcion = async (suscripcionId, nuevoEstadoPago) => {
    try {
      await suscripcionService.actualizarEstadoPagoSuscripcion(suscripcionId, nuevoEstadoPago)
      showAlert('success', 'Estado de Pago Actualizado', `Pago de suscripción ${nuevoEstadoPago} exitosamente`)
      fetchData()
    } catch (error) {
      console.error('Error al cambiar estado de pago:', error)
      showAlert('error', 'Error', 'Error al cambiar el estado de pago de la suscripción')
    }
  }

  const cambiarEstadoSuscripcion = async (suscripcionId, nuevoEstado) => {
    try {
      await suscripcionService.actualizarEstadoSuscripcion(suscripcionId, nuevoEstado)
      showAlert('success', 'Estado Actualizado', `Suscripción ${nuevoEstado} exitosamente`)
      fetchData()
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      showAlert('error', 'Error', 'Error al cambiar el estado de la suscripción')
    }
  }

  const cambiarPrecioSuscripcion = async (suscripcionId, nuevoPrecio) => {
    try {
      await suscripcionService.actualizarPrecioSuscripcion(suscripcionId, nuevoPrecio)
      showAlert('success', 'Precio Actualizado', `Precio de suscripción actualizado a $${nuevoPrecio} exitosamente`)
      setShowPriceModal(false)
      setSelectedItem(null)
      setNewPrice('')
      fetchData()
    } catch (error) {
      console.error('Error al cambiar precio de suscripción:', error)
      showAlert('error', 'Error', 'Error al cambiar el precio de la suscripción')
    }
  }

  // Funciones para reactivar reservas y suscripciones canceladas
  const reactivarReserva = async (reservaId) => {
    try {
      await reservaService.reactivarReserva(reservaId)
      showAlert('success', 'Reserva Reactivada', 'Reserva reactivada exitosamente')
      fetchData()
    } catch (error) {
      console.error('Error al reactivar reserva:', error)
      showAlert('error', 'Error', 'Error al reactivar la reserva')
    }
  }

  const reactivarSuscripcion = async (suscripcionId) => {
    try {
      await suscripcionService.reactivarSuscripcion(suscripcionId)
      showAlert('success', 'Suscripción Reactivada', 'Suscripción reactivada exitosamente')
      fetchData()
    } catch (error) {
      console.error('Error al reactivar suscripción:', error)
      showAlert('error', 'Error', 'Error al reactivar la suscripción')
    }
  }

  // Funciones para modales
  const openPriceModal = (item) => {
    setSelectedItem(item)
    setNewPrice(item.precio.toString())
    setShowPriceModal(true)
  }

  const handlePriceSubmit = () => {
    if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
      showAlert('error', 'Precio Inválido', 'Por favor ingresa un precio válido')
      return
    }

    const precio = parseFloat(newPrice)
    
    if (selectedItem.tipo === 'suscripcion') {
      const suscripcionId = selectedItem.id.replace('suscripcion_', '')
      cambiarPrecioSuscripcion(suscripcionId, precio)
    } else {
      cambiarPrecioReserva(selectedItem.id, precio)
    }
  }

  const limpiarFiltros = () => {
    // Al limpiar filtros, establecer fecha de hoy para mostrar desde hoy en adelante
    const hoy = new Date().toISOString().split('T')[0];
    
    setFiltros(prev => ({
      ...prev,
      fecha: hoy, // 👆 Filtrar desde hoy en adelante
      usuarioEspecifico: '',
      cancha: 'todas',
      estado: 'todas',
      metodoPago: 'todos'
    }))
  }

  return (
    <div className="reservas-tab">
      {/* Modal de Alertas */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
        autoClose={alertConfig.autoClose}
      />

      {/* Modal para editar precio */}
      {showPriceModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{selectedItem.tipo === 'suscripcion' ? 'Editar Precio Mensual' : 'Editar Precio'}</h3>
              <button className="close-btn" onClick={() => setShowPriceModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{selectedItem.tipo === 'suscripcion' ? 'Precio Mensual Actual:' : 'Precio Actual:'}</label>
                <span className="current-price">${selectedItem.precio}</span>
              </div>
              <div className="form-group">
                <label htmlFor="newPrice">{selectedItem.tipo === 'suscripcion' ? 'Nuevo Precio Mensual:' : 'Nuevo Precio:'}</label>
                <input
                  type="number"
                  id="newPrice"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder={selectedItem.tipo === 'suscripcion' ? "Ingresa el nuevo precio mensual" : "Ingresa el nuevo precio"}
                />
              </div>
              {selectedItem.tipo === 'suscripcion' && (
                <div className="form-group">
                  <small style={{ color: '#666' }}>
                    Para suscripciones, puedes modificar el precio mensual directamente.
                  </small>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowPriceModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={handlePriceSubmit}
              >
                {selectedItem.tipo === 'suscripcion' ? 'Actualizar Precio Mensual' : 'Actualizar Precio'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="filtros-section">
        <div className="filtros-header">
          <h3>Filtros</h3>
          <button 
            className="btn-secondary btn-small"
            onClick={limpiarFiltros}
            title="Mostrar todas las reservas desde hoy en adelante"
          >
            🔄 Desde Hoy
          </button>
        </div>
        <div className="filtros-grid">
          <div className="filtro-item">
            <label>Fecha:</label>
            <input 
              type="date" 
              value={filtros.fecha}
              onChange={(e) => setFiltros(prev => ({...prev, fecha: e.target.value}))}
              placeholder="Seleccionar fecha..."
            />
          </div>

          <div className="filtro-item">
            <label>Buscar Usuario/Cliente:</label>
            <input 
              type="text" 
              value={filtros.usuarioEspecifico}
              onChange={(e) => setFiltros(prev => ({...prev, usuarioEspecifico: e.target.value}))}
              placeholder="Nombre del usuario, email o cliente..."
            />
          </div>

          <div className="filtro-item">
            <label>Cancha:</label>
            <select 
              value={filtros.cancha}
              onChange={(e) => setFiltros(prev => ({...prev, cancha: e.target.value}))}
            >
              <option value="todas">Todas las canchas</option>
              {canchas.map(cancha => (
                <option key={cancha.id} value={cancha.id}>{cancha.nombre}</option>
              ))}
            </select>
          </div>
          
          <div className="filtro-item">
            <label>Estado:</label>
            <select 
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({...prev, estado: e.target.value}))}
            >
              <option value="todas">Todos los estados</option>
              <option value="confirmada">Confirmada</option>
              <option value="pendiente">Pendiente</option>
              <option value="activa">Activa</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          
          <div className="filtro-item">
            <label>Método de Pago:</label>
            <select 
              value={filtros.metodoPago}
              onChange={(e) => setFiltros(prev => ({...prev, metodoPago: e.target.value}))}
            >
              <option value="todos">Todos los métodos</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
        </div>
      </div>

      {/* 💡 MENSAJE INFORMATIVO DE FILTROS */}
      <div className="filtros-info" style={{
        background: 'rgba(74, 144, 226, 0.1)',
        border: '1px solid rgba(74, 144, 226, 0.3)',
        borderRadius: '10px',
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#4a90e2' }}>
          <span>ℹ️</span>
          <span>
            {(() => {
              if (filtros.usuarioEspecifico && filtros.usuarioEspecifico.trim() !== '') {
                return `Mostrando TODAS las reservas que contienen "${filtros.usuarioEspecifico}" (sin límite de fecha)`;
              } else if (filtros.fecha) {
                return `Mostrando reservas para el ${filtros.fecha}`;
              } else {
                const hoy = new Date().toLocaleDateString('es-AR');
                return `Mostrando reservas desde hoy (${hoy}) en adelante, ordenadas por fecha y hora`;
              }
            })()}
          </span>
        </div>
      </div>

      <div className="reservas-table">
        <h3>Reservas y Suscripciones ({reservasFiltradas.length})</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Cancha</th>
                <th>Usuario</th>
                <th>Deporte</th>
                <th>Precio</th>
                <th>Método Pago</th>
                <th>Estado</th>
                <th>Estado Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservasFiltradas.map((reserva) => (
                <tr key={reserva.id} style={{ backgroundColor: getTipoColor(reserva) }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getTipoIcon(reserva)}
                      {(() => {
                        const [year, month, day] = reserva.fecha.split('-').map(Number);
                        const fecha = new Date(year, month - 1, day);
                        return fecha.toLocaleDateString('es-AR');
                      })()} 
                    </div>
                  </td>
                  <td>{formatearHora(reserva.hora_inicio)} - {formatearHora(reserva.hora_fin)}</td>
                  <td>{canchas.find(c => c.id === reserva.cancha_id)?.nombre || 'N/A'}</td>
                  <td>
                    {reserva.nombre_cliente ? (
                      <div>
                        <div><strong>{reserva.nombre_cliente}</strong></div>
                        <small style={{ color: '#666' }}>
                          (Admin: {usuarios.find(u => u.id === reserva.user_id)?.nombre || 'N/A'})
                        </small>
                      </div>
                    ) : (
                      usuarios.find(u => u.id === reserva.user_id)?.nombre || 'N/A'
                    )}
                  </td>
                  <td>{reserva.deporte}</td>
                  <td>
                    ${reserva.precio}
                  </td>
                  <td>
                    <span className={`badge ${reserva.metodo_pago}`}>
                      {reserva.metodo_pago}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${reserva.estado}`}>
                      {reserva.estado}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${reserva.estado_pago || 'pendiente'}`}>
                      {reserva.estado_pago || 'pendiente'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      {/* Aprobar/Rechazar Reserva */}
                      {reserva.tipo !== 'suscripcion' ? (
                        <>
                          {/* Botón de estado para RESERVAS */}
                          {reserva.estado === 'cancelada' || reserva.estado === 'pendiente' ? (
                            <button 
                              className="btn-small btn-success"
                              onClick={() => cambiarEstadoReserva(reserva.id, 'confirmada')}
                              title="Confirmar reserva"
                            >
                              <span className="icon"><i class="fa-solid fa-check"></i></span>
                            </button>
                          ) : (
                            <button 
                              className="btn-small btn-danger"
                              onClick={() => cambiarEstadoReserva(reserva.id, 'cancelada')}
                              title="Cancelar reserva"
                            >
                              <span className="icon"><i class="fa-solid fa-x"></i></span>
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Botón de estado para SUSCRIPCIONES */}
                          {reserva.estado === 'cancelada' ? (
                            <button 
                              className="btn-small btn-success"
                              onClick={() => cambiarEstadoSuscripcion(reserva.id.replace('suscripcion_', ''), 'activa')}
                              title="Activar suscripción"
                            >
                              <span className="icon"><i class="fa-solid fa-check"></i></span>
                            </button>
                          ) : (
                            <button 
                              className="btn-small btn-danger"
                              onClick={() => cambiarEstadoSuscripcion(reserva.id.replace('suscripcion_', ''), 'cancelada')}
                              title="Cancelar suscripción"
                            >
                              <span className="icon"><i class="fa-solid fa-x"></i></span>
                            </button>
                          )}
                        </>
                      )}
                      
                      {/* Aprobar/Rechazar Pago */}
                      {reserva.tipo !== 'suscripcion' ? (
                        <>
                          {/* Para RESERVAS: estado de pago "pendiente" por defecto */}
                          <button 
                            className="btn-small btn-success"
                            onClick={() => cambiarEstadoPagoReserva(reserva.id, 'pagado')}
                            disabled={reserva.estado_pago === 'pagado'}
                            title="Marcar como pagado"
                          >
                            <span className="icon"><i class="fa-regular fa-thumbs-up"></i></span>
                          </button>
                          <button 
                            className="btn-small btn-warning"
                            onClick={() => cambiarEstadoPagoReserva(reserva.id, 'cancelado')}
                            disabled={reserva.estado_pago === 'cancelado'}
                            title="Cancelar pago"
                          >
                            <span className="icon">⚠</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Para SUSCRIPCIONES: estado de pago "pendiente" por defecto */}
                          <button 
                            className="btn-small btn-success"
                            onClick={() => cambiarEstadoPagoSuscripcion(reserva.id.replace('suscripcion_', ''), 'aprobado')}
                            disabled={reserva.estado_pago === 'aprobado'}
                            title="Aprobar pago"
                          >
                            <span className="icon"><i class="fa-regular fa-thumbs-up"></i></span>
                          </button>
                          <button 
                            className="btn-small btn-warning"
                            onClick={() => cambiarEstadoPagoSuscripcion(reserva.id.replace('suscripcion_', ''), 'rechazado')}
                            disabled={reserva.estado_pago === 'rechazado'}
                            title="Rechazar pago"
                          >
                            <span className="icon">⚠</span>
                          </button>
                        </>
                      )}
                      
                      {/* Editar Precio */}
                      <button 
                        className="btn-small btn-info"
                        onClick={() => openPriceModal(reserva)}
                        title={reserva.tipo === 'suscripcion' ? "Editar precio mensual de suscripción" : "Editar precio"}
                      >
                        <span className="icon">$</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

AdminReservations.propTypes = {
  reservas: PropTypes.array.isRequired,
  canchas: PropTypes.array.isRequired,
  usuarios: PropTypes.array.isRequired,
  filtros: PropTypes.object.isRequired,
  setFiltros: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  fetchData: PropTypes.func.isRequired
}

export default AdminReservations
