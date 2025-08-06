import os
import firebase_admin
from firebase_admin import credentials, auth
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

firebase_service = None

def initialize_firebase():
    """Inicializar Firebase Admin SDK"""
    global firebase_service
    
    if firebase_service:
        logger.info("Firebase ya estaba inicializado")
        return firebase_service
    
    # Buscar credenciales en múltiples ubicaciones
    credentials_path = settings.FIREBASE_CREDENTIALS_PATH
    
    # Si no está configurado en settings, buscar en el directorio actual
    if not credentials_path:
        current_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        possible_paths = [
            os.path.join(current_dir, "quicobasquet-7fd46-firebase-adminsdk-fbsvc-628f2a1356.json"),
            os.path.join(current_dir, "firebase-credentials.json"),
            "quicobasquet-7fd46-firebase-adminsdk-fbsvc-628f2a1356.json"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                credentials_path = path
                logger.info(f"Encontrado archivo de credenciales en: {path}")
                break
    
    if not credentials_path:
        logger.warning("FIREBASE_CREDENTIALS_PATH no configurado y no se encontró archivo de credenciales")
        logger.warning("Para usar Firebase, necesitas:")
        logger.warning("1. Descargar el archivo de credenciales de Firebase Console")
        logger.warning("2. Colocarlo en la raíz del proyecto backend")
        logger.warning("3. Configurar FIREBASE_CREDENTIALS_PATH en .env")
        return None
    
    if not os.path.exists(credentials_path):
        logger.warning(f"Archivo de credenciales no encontrado en: {credentials_path}")
        logger.warning("Para usar Firebase, necesitas:")
        logger.warning("1. Descargar el archivo de credenciales de Firebase Console")
        logger.warning("2. Colocarlo en la ruta especificada")
        logger.warning("3. Asegurarte de que FIREBASE_CREDENTIALS_PATH sea correcto")
        return None
    
    try:
        logger.info(f"Intentando inicializar Firebase con credenciales desde: {credentials_path}")
        cred = credentials.Certificate(credentials_path)
        firebase_service = firebase_admin.initialize_app(cred)
        logger.info(f"✅ Firebase inicializado correctamente con credenciales desde: {credentials_path}")
        return firebase_service
    except Exception as e:
        logger.error(f"❌ Error al inicializar Firebase: {e}")
        import traceback
        logger.error(f"🔍 Traceback: {traceback.format_exc()}")
        return None

def verify_firebase_token(token: str) -> dict:
    """Verificar token de Firebase y retornar información del usuario"""
    if not firebase_service:
        logger.warning("Firebase no inicializado")
        return None
    
    if not token:
        logger.warning("Token vacío recibido")
        return None
    
    # Intentar verificar el token con reintentos para manejar problemas de tiempo
    max_retries = 5  # Aumentar el número de reintentos
    base_delay = 2  # Delay base más largo
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Verificando token de Firebase (intento {attempt + 1}/{max_retries})...")
            decoded_token = auth.verify_id_token(token)
            user_info = {
                "uid": decoded_token["uid"],
                "email": decoded_token.get("email", ""),
                "name": decoded_token.get("name", ""),
                "email_verified": decoded_token.get("email_verified", False)
            }
            
            logger.info(f"✅ Token verificado para usuario: {user_info['email']}")
            return user_info
            
        except auth.InvalidIdTokenError as e:
            error_msg = str(e)
            logger.error(f"❌ Token de Firebase inválido (intento {attempt + 1}): {error_msg}")
            
            # Si es un error de tiempo, intentar de nuevo con delay progresivo
            if "too early" in error_msg.lower() and attempt < max_retries - 1:
                retry_delay = base_delay * (2 ** attempt)  # Delay exponencial: 2, 4, 8, 16 segundos
                logger.info(f"⏰ Error de tiempo detectado, esperando {retry_delay} segundos antes de reintentar...")
                import time
                time.sleep(retry_delay)
                continue
            else:
                return None
                
        except auth.ExpiredIdTokenError as e:
            logger.error(f"❌ Token de Firebase expirado: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Error al verificar token (intento {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                logger.info(f"🔄 Reintentando en {retry_delay} segundos...")
                import time
                time.sleep(retry_delay)
                retry_delay *= 2
                continue
            else:
                import traceback
                logger.error(f"🔍 Traceback: {traceback.format_exc()}")
                return None
    
    logger.error(f"❌ No se pudo verificar el token después de {max_retries} intentos")
    return None

# Inicializar Firebase al importar el módulo
try:
    logger.info("🚀 Inicializando Firebase al importar el módulo...")
    firebase_service = initialize_firebase()
    if firebase_service:
        logger.info("✅ Firebase inicializado correctamente al importar")
    else:
        logger.warning("⚠️ Firebase no pudo inicializarse al importar")
except Exception as e:
    logger.error(f"❌ No se pudo inicializar Firebase al importar: {e}")
    firebase_service = None
