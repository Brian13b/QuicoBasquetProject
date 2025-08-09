import os
import json
import logging
import firebase_admin
from firebase_admin import credentials, auth
from app.config.settings import settings

logger = logging.getLogger(__name__)

firebase_service = None

def initialize_firebase():
    """Inicializar Firebase Admin SDK desde archivo o variable de entorno"""
    global firebase_service

    if firebase_service:
        logger.info("✅ Firebase ya estaba inicializado")
        return firebase_service

    firebase_credentials_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

    try:
        if firebase_credentials_json:
            logger.info("🔐 Inicializando Firebase desde variable de entorno JSON")
            cred = credentials.Certificate(json.loads(firebase_credentials_json))
        else:
            # Opcional: intentar buscar en rutas comunes (fallback para desarrollo)
            current_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            fallback_paths = [
                os.path.join(current_dir, "firebase-credentials.json"),
                os.path.join(current_dir, "quicobasquet-7fd46-firebase-adminsdk-fbsvc-628f2a1356.json")
            ]
            for path in fallback_paths:
                if os.path.exists(path):
                    logger.info(f"🔎 Credenciales encontradas en ruta fallback: {path}")
                    cred = credentials.Certificate(path)
                    break
            else:
                raise FileNotFoundError("❌ No se encontraron credenciales de Firebase (ni JSON ni archivo)")

        firebase_service = firebase_admin.initialize_app(cred)
        logger.info("✅ Firebase inicializado correctamente")
        return firebase_service

    except Exception as e:
        logger.error(f"❌ Error al inicializar Firebase: {e}")
        import traceback
        logger.error(f"🔍 Traceback: {traceback.format_exc()}")
        return None


def verify_firebase_token(token: str) -> dict:
    """Verificar token de Firebase y retornar información del usuario"""
    if not firebase_service:
        logger.warning("⚠️ Firebase no está inicializado")
        return None

    if not token:
        logger.warning("⚠️ Token vacío recibido")
        return None

    max_retries = 5
    base_delay = 2

    for attempt in range(max_retries):
        try:
            logger.info(f"🔐 Verificando token de Firebase (intento {attempt + 1}/{max_retries})...")
            decoded_token = auth.verify_id_token(token)
            return {
                "uid": decoded_token["uid"],
                "email": decoded_token.get("email", ""),
                "name": decoded_token.get("name", ""),
                "email_verified": decoded_token.get("email_verified", False)
            }

        except auth.InvalidIdTokenError as e:
            error_msg = str(e)
            logger.error(f"❌ Token inválido (intento {attempt + 1}): {error_msg}")
            if "too early" in error_msg.lower() and attempt < max_retries - 1:
                retry_delay = base_delay * (2 ** attempt)
                logger.info(f"⏳ Esperando {retry_delay} segundos antes de reintentar...")
                import time
                time.sleep(retry_delay)
                continue
            else:
                return None

        except auth.ExpiredIdTokenError as e:
            logger.error(f"❌ Token expirado: {e}")
            return None

        except Exception as e:
            logger.error(f"❌ Error al verificar token (intento {attempt + 1}): {e}")
            retry_delay = base_delay * (2 ** attempt)
            if attempt < max_retries - 1:
                logger.info(f"🔄 Reintentando en {retry_delay} segundos...")
                import time
                time.sleep(retry_delay)
            else:
                import traceback
                logger.error(f"🔍 Traceback: {traceback.format_exc()}")
                return None

    logger.error("❌ No se pudo verificar el token después de múltiples intentos")
    return None


# Inicializar Firebase automáticamente al importar el módulo
try:
    logger.info("🚀 Inicializando Firebase al importar el módulo...")
    firebase_service = initialize_firebase()
    if firebase_service:
        logger.info("✅ Firebase inicializado correctamente al importar")
    else:
        logger.warning("⚠️ Firebase no se inicializó correctamente al importar")
except Exception as e:
    logger.error(f"❌ Excepción al inicializar Firebase al importar: {e}")
    firebase_service = None
