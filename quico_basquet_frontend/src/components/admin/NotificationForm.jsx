import { useState, useEffect } from 'react'
import { sendNotification, getUsersList } from '../../api/authService'

function NotificationForm({ onNotificationSent }) {
  const [formData, setFormData] = useState({
    tipo: 'general',
    asunto: '',
    mensaje: '',
    destinatarios: 'todos',
    usuario_id_especifico: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [usuarios, setUsuarios] = useState([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    try {
      setLoadingUsuarios(true)
      const data = await getUsersList()
      setUsuarios(data)
    } catch (error) {
      setMessage('Error al cargar la lista de usuarios')
      setMessageType('error')
    } finally {
      setLoadingUsuarios(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await sendNotification(formData)
      setMessage(`Notificación enviada exitosamente. Enviados: ${response.enviados_exitosos}, Fallidos: ${response.enviados_fallidos}`)
      setMessageType('success')
      
      setFormData({
        tipo: 'general',
        asunto: '',
        mensaje: '',
        destinatarios: 'todos',
        usuario_id_especifico: ''
      })
      
      if (onNotificationSent) {
        onNotificationSent()
      }
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.detail || error.message}`)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="notification-form-container">
      <div className="form-header">
        <h2>Enviar Notificación Masiva</h2>
        <p>Envía notificaciones por email a tus usuarios</p>
      </div>

      <form onSubmit={handleSubmit} className="notification-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="tipo">Tipo de Notificación</label>
            <select
              id="tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleInputChange}
              required
            >
              <option value="general">General</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="promocion">Promoción</option>
              <option value="reserva">Información de Reserva</option>
              <option value="suscripcion">Información de Suscripción</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="destinatarios">Destinatarios</label>
            <select
              id="destinatarios"
              name="destinatarios"
              value={formData.destinatarios}
              onChange={handleInputChange}
              required
            >
              <option value="todos">Todos los usuarios</option>
              <option value="activos">Usuarios activos (últimos 30 días)</option>
              <option value="especifico">Usuario específico</option>
            </select>
          </div>
        </div>

        {formData.destinatarios === 'especifico' && (
          <div className="form-group">
            <label htmlFor="usuario_id_especifico">Seleccionar Usuario</label>
            {loadingUsuarios ? (
              <div className="loading-users">
                <p>Cargando usuarios...</p>
              </div>
            ) : (
              <select
                id="usuario_id_especifico"
                name="usuario_id_especifico"
                value={formData.usuario_id_especifico}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona un usuario</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre} ({usuario.telefono || 'Sin teléfono'})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="asunto">Asunto</label>
          <input
            type="text"
            id="asunto"
            name="asunto"
            value={formData.asunto}
            onChange={handleInputChange}
            placeholder="Asunto de la notificación"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="mensaje">Mensaje</label>
          <textarea
            id="mensaje"
            name="mensaje"
            value={formData.mensaje}
            onChange={handleInputChange}
            placeholder="Escribe tu mensaje aquí..."
            rows="6"
            required
          />
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar Notificación'}
        </button>
      </form>
    </div>
  )
}

export default NotificationForm 