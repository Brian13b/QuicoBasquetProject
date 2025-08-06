import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/components/authModal.css'

function AuthModal({ onClose, isStandalone = false }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, loginWithGoogle, register } = useAuth()
  const navigate = useNavigate()

  // Función para validar el teléfono
  const validatePhone = (phone) => {
    // Permitir números con o sin código de país, con espacios, guiones o paréntesis
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/
    return phoneRegex.test(phone.trim())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        // Validaciones adicionales para registro
        if (!name.trim()) {
          throw new Error('El nombre es requerido')
        }
        if (!number.trim()) {
          throw new Error('El número de teléfono es requerido')
        }
        if (!validatePhone(number)) {
          throw new Error('Por favor ingresa un número de teléfono válido')
        }
        
        await register(email, password, { name: name.trim(), number: number.trim() })
      }
      
      if (isStandalone) {
        navigate('/')
      } else if (onClose) {
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Error en la autenticación')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    
    try {
      // El nuevo método loginWithGoogle ya maneja todo el flujo:
      // 1. Autentica con Firebase
      // 2. Obtiene el token
      // 3. Lo envía al backend
      // 4. Configura el estado
      await loginWithGoogle()
      
      if (isStandalone) {
        navigate('/')
      } else if (onClose) {
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className={`auth-modal ${isStandalone ? 'standalone' : ''}`}>
        {!isStandalone && (
          <button 
            className="btn-close" 
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        )}
      
      <h2>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>
      
      <button 
        className="btn-google" 
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <i className="fab fa-google"></i> Continuar con Google
      </button>
      
      <div className="divider">o</div>
      
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <div className="form-group">
              <label htmlFor="name">Nombre:</label>
              <input 
                id="name"
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="number">Número de Teléfono:</label>
              <input 
                id="number"
                type="tel" 
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
                disabled={loading}
                placeholder="Ej: +54 9 11 1234-5678"
                pattern="[\+]?[0-9\s\-\(\)]{8,15}"
                title="Ingresa un número de teléfono válido (8-15 dígitos, puede incluir +, espacios, guiones o paréntesis)"
              />
            </div>
          </>
        )}
        
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input 
            id="email"
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input 
            id="password"
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
            disabled={loading}
          />
        </div>
        
        {error && <p className="error">{error}</p>}
        
        <button 
          type="submit" 
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
        </button>
      </form>
      
      <p className="toggle-auth">
        {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
        <button 
          type="button" 
          onClick={() => setIsLogin(!isLogin)}
          disabled={loading}
          className="text-button"
        >
          {isLogin ? 'Regístrate aquí' : 'Inicia sesión aquí'}
        </button>
      </p>
      </div>
    </div>
  )
}

export default AuthModal