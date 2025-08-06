import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/authService';
import { 
  loginWithEmail as firebaseEmailLogin, 
  loginWithGoogle as firebaseGoogleLogin,
  register as firebaseRegister, 
  logout as firebaseLogout 
} from '../services/auth';
import { useNavigate } from 'react-router-dom';
// Importar verificación de autenticación
import '../utils/checkAuth';
import CompleteProfileModal from '../components/CompleteProfileModal';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [pendingFirebaseUser, setPendingFirebaseUser] = useState(null);
  const [pendingFirebaseToken, setPendingFirebaseToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      authService.getCurrentUser(token)
        .then(user => {
          setCurrentUser(user);
          setLoading(false);
        })
        .catch(() => {
          logout();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log('🚀 Iniciando login con email (flujo correcto)');
      
      // PASO 1: Autenticar con Firebase Auth
      console.log('📧 Autenticando con Firebase Auth...');
      const firebaseResult = await firebaseEmailLogin(email, password);
      console.log('✅ Usuario autenticado en Firebase:', firebaseResult.user.uid);
      
      // PASO 2: Obtener el ID token de Firebase
      console.log('🔐 Obteniendo ID token de Firebase...');
      const firebaseIdToken = await firebaseResult.user.getIdToken();
      console.log('✅ ID token obtenido');
      
      // PASO 3: Enviar token al backend para validar y obtener usuario de BD propia
      console.log('📤 Enviando token al backend para validación...');
      const backendResponse = await authService.loginWithFirebaseToken(firebaseIdToken);
      console.log('✅ Usuario validado en backend:', backendResponse);
      
      // PASO 4: Configurar estado local con el token del backend
      localStorage.setItem('token', backendResponse.access_token);
      setToken(backendResponse.access_token);
      setCurrentUser(backendResponse.user || backendResponse);
      
      return backendResponse;
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      // Si falla Firebase, intentar con el backend directo (fallback)
      try {
        console.log('🔄 Intentando login directo con backend...');
        const { access_token } = await authService.login(email, password);
        localStorage.setItem('token', access_token);
        setToken(access_token);
        const user = await authService.getCurrentUser(access_token);
        setCurrentUser(user);
        return user;
      } catch (backendError) {
        throw backendError;
      }
    }
  };

  const loginWithGoogle = async () => {
    try {
      console.log('🚀 Iniciando login con Google (flujo correcto)');
      
      // PASO 1: Autenticar con Firebase Google Auth
      console.log('📧 Autenticando con Google via Firebase...');
      const firebaseResult = await firebaseGoogleLogin();
      console.log('✅ Usuario autenticado con Google:', firebaseResult.user.uid);
      
      // PASO 2: Esperar un poco más para asegurar que el token sea válido
      console.log('⏰ Esperando para que el token sea válido...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos de espera
      
      // PASO 3: Obtener el ID token de Firebase con reintentos
      console.log('🔐 Obteniendo ID token de Firebase...');
      let firebaseIdToken;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          firebaseIdToken = await firebaseResult.user.getIdToken(true); // Force refresh
          console.log('✅ ID token obtenido');
          break;
        } catch (error) {
          retryCount++;
          console.log(`⚠️ Error obteniendo token (intento ${retryCount}/${maxRetries}):`, error);
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          } else {
            throw new Error('No se pudo obtener el token de Firebase después de varios intentos');
          }
        }
      }
      
      // PASO 4: Enviar token al backend con reintentos
      console.log('📤 Enviando token al backend para validación...');
      let backendResponse;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          backendResponse = await authService.loginWithFirebaseToken(firebaseIdToken);
          console.log('✅ Usuario validado/creado en backend:', backendResponse);
          break;
        } catch (error) {
          retryCount++;
          console.log(`⚠️ Error en backend (intento ${retryCount}/${maxRetries}):`, error);
          
          // Si es un error de token inválido y no es el último intento, esperar y reintentar
          if (error.message?.includes('Token de Firebase inválido') && retryCount < maxRetries) {
            const waitTime = 2000 * retryCount; // 2, 4, 6 segundos
            console.log(`⏰ Esperando ${waitTime}ms antes de reintentar...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Refrescar el token antes del siguiente intento
            try {
              firebaseIdToken = await firebaseResult.user.getIdToken(true);
              console.log('🔄 Token refrescado para reintento');
            } catch (refreshError) {
              console.log('⚠️ Error refrescando token:', refreshError);
            }
          } else {
            throw error;
          }
        }
      }
      
      // PASO 5: Si es un nuevo usuario (action: "register"), mostrar modal para completar datos
      if (backendResponse.action === "register") {
        console.log('🆕 Usuario nuevo detectado, mostrando modal para completar datos...');
        
        // Guardar datos pendientes y mostrar modal
        setPendingFirebaseUser(firebaseResult.user);
        setPendingFirebaseToken(firebaseIdToken);
        setShowCompleteProfile(true);
        
        // No completar el login hasta que se completen los datos
        return backendResponse;
      }
      
      // PASO 6: Configurar estado local con el token del backend
      localStorage.setItem('token', backendResponse.access_token);
      setToken(backendResponse.access_token);
      setCurrentUser(backendResponse.user || backendResponse);
      
      return backendResponse;
      
    } catch (error) {
      console.error('❌ Error en login con Google:', error);
      throw error;
    }
  };

  // Función para completar el perfil con datos adicionales
  const completeProfile = async (additionalData) => {
    try {
      console.log('📝 Completando perfil con datos adicionales...');
      
      // Actualizar usuario con datos adicionales
      const updatedResponse = await authService.registerWithFirebaseToken(
        {
          email: pendingFirebaseUser.email,
          name: additionalData.name || pendingFirebaseUser.displayName,
          phone: additionalData.phone,
          firebase_uid: pendingFirebaseUser.uid
        },
        pendingFirebaseToken
      );
      
      // Actualizar estado con el usuario completo
      localStorage.setItem('token', updatedResponse.access_token);
      setToken(updatedResponse.access_token);
      setCurrentUser(updatedResponse.user || updatedResponse);
      
      // Limpiar estado del modal
      setShowCompleteProfile(false);
      setPendingFirebaseUser(null);
      setPendingFirebaseToken(null);
      
      console.log('✅ Perfil completado exitosamente');
      return updatedResponse;
      
    } catch (error) {
      console.error('❌ Error completando perfil:', error);
      throw error;
    }
  };

  // Función para cancelar la completación del perfil
  const cancelCompleteProfile = () => {
    setShowCompleteProfile(false);
    setPendingFirebaseUser(null);
    setPendingFirebaseToken(null);
    // Cerrar sesión de Firebase ya que no se completó el registro
    firebaseLogout();
  };

  const register = async (email, password, additionalData = {}) => {
    try {
      console.log('🚀 Iniciando flujo de registro correcto:', { email, additionalData });
      
      // PASO 1: Registrar en Firebase Auth
      console.log('📧 Registrando en Firebase Auth...');
      const firebaseResult = await firebaseRegister(email, password);
      console.log('✅ Usuario creado en Firebase:', firebaseResult.user.uid);
      
      // PASO 2: Obtener el ID token de Firebase
      console.log('🔐 Obteniendo ID token de Firebase...');
      const firebaseIdToken = await firebaseResult.user.getIdToken();
      console.log('✅ ID token obtenido');
      
      // PASO 3: Enviar token al backend para validar y guardar en BD propia
      console.log('📤 Enviando datos al backend para validación y almacenamiento...');
      const userData = {
        email: firebaseResult.user.email,
        name: additionalData.name,
        phone: additionalData.number,
        firebase_uid: firebaseResult.user.uid,
      };
      
      // El backend validará el token y guardará los datos
      const backendResponse = await authService.registerWithFirebaseToken(userData, firebaseIdToken);
      console.log('✅ Usuario guardado en backend:', backendResponse);
      
      // PASO 4: Configurar estado local con el token del backend
      if (backendResponse.access_token) {
        localStorage.setItem('token', backendResponse.access_token);
        setToken(backendResponse.access_token);
        setCurrentUser(backendResponse.user || backendResponse);
      }
      
      return backendResponse;
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            throw new Error('Este email ya está registrado en Firebase');
          case 'auth/invalid-email':
            throw new Error('El email no es válido');
          case 'auth/operation-not-allowed':
            throw new Error('El registro está deshabilitado. Contacta al administrador.');
          case 'auth/weak-password':
            throw new Error('La contraseña debe tener al menos 6 caracteres');
          default:
            throw new Error(`Error de Firebase: ${error.message}`);
        }
      }
      
      // Error del backend
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Cerrar sesión en Firebase
      await firebaseLogout();
    } catch (error) {
      console.error('Error al cerrar sesión en Firebase:', error);
    } finally {
      // Limpiar estado local independientemente del resultado de Firebase
      localStorage.removeItem('token');
      setToken(null);
      setCurrentUser(null);
      navigate('/');  // Redirigir al inicio en lugar de /login
    }
  };

  const value = {
    currentUser,
    token,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    completeProfile,
    cancelCompleteProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      
      {/* Modal para completar perfil */}
      {showCompleteProfile && pendingFirebaseUser && (
        <CompleteProfileModal
          user={pendingFirebaseUser}
          onComplete={completeProfile}
          onCancel={cancelCompleteProfile}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}