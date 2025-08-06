import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import '../styles/pages/auth.css'

function Auth() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true })
    }
  }, [currentUser, navigate, from])

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-hero">
          <h1>Quico Basquet</h1>
          <p>Reserva tu cancha de básquet o vóley en pocos pasos</p>
        </div>
        
        <div className="auth-form-container">
          <h2>Inicia sesión o regístrate</h2>
          <AuthModal isStandalone={true} />
        </div>
      </div>
    </div>
  )
}

export default Auth