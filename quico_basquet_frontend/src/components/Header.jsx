import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import '../styles/components/header.css'

function Header() {
  const { currentUser, logout } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <header>
      <div className="container">
        <div className="logo">
          <img src="/src/assets/logo.png" alt="Quico Basquet Logo" />
        </div>

        <div className="login">
          {currentUser ? (
            <div className="user-menu">
              <span>Hola, {currentUser.nombre || currentUser.email}</span>
                             {currentUser.rol === 'usuario' && (
                 <a href="/mis-reservas" className="reservations-link">Mis Reservas</a>
               )}
              {currentUser.rol === 'admin' && (
                <a href="/admin" className="admin-link">Admin</a>
              )}
              <button onClick={logout}>Cerrar Sesión</button>
            </div>
          ) : (
            <a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true) }}>
              Iniciar Sesión
            </a>
          )}
        </div>
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </header>
  )
}

export default Header