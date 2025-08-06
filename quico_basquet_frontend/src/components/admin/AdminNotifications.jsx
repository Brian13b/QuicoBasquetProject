import { useState } from 'react'
import NotificationForm from './NotificationForm'
import NotificationHistory from './NotificationHistory'
import NotificationStats from './NotificationStats'
import '../../styles/components/AdminNotifications.css'

function AdminNotifications() {
  const [activeTab, setActiveTab] = useState('enviar')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleNotificationSent = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="notificaciones-tab">
      <div className="notifications-tabs">
        <button 
          className={`tab-btn ${activeTab === 'enviar' ? 'active' : ''}`}
          onClick={() => setActiveTab('enviar')}
        >
          Enviar Notificación
        </button>
        <button 
          className={`tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          Historial
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Estadísticas
        </button>
      </div>

      {activeTab === 'enviar' && (
        <NotificationForm onNotificationSent={handleNotificationSent} />
      )}

      {activeTab === 'historial' && (
        <NotificationHistory key={`historial-${refreshKey}`} />
      )}

      {activeTab === 'stats' && (
        <NotificationStats key={`stats-${refreshKey}`} />
      )}
    </div>
  )
}

export default AdminNotifications
