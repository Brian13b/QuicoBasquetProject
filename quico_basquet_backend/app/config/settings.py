import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

# Constantes para compatibilidad con código existente
HORARIO_APERTURA = "08:00"
HORARIO_CIERRE = "24:00"
DURACION_MINIMA_RESERVA = 60  # minutos
DURACION_MAXIMA_RESERVA = 120  # minutos

class Settings:
    # Configuración de la base de datos
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Configuración de seguridad
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tu_clave_secreta_aqui_cambiala_en_produccion")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Configuración de Firebase
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    
    # Configuración de email
    GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "")
    GMAIL_USER: str = os.getenv("GMAIL_USER", "basquetquico@gmail.com")
    
    # Configuración de datos bancarios
    DATOS_BANCARIOS: dict = {
        "alias": os.getenv("ALIAS_TRANSFERENCIA", ""),
        "cbu": os.getenv("CBU_TRANSFERENCIA", ""),
        "bank": os.getenv("BANCO_TRANSFERENCIA", ""),
        "holder": os.getenv("TITULAR_TRANSFERENCIA", ""),
        "whatsapp": os.getenv("WHATSAPP_TRANSFERENCIA", "")
    }

    # Configuración de Twilio (para WhatsApp)
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")
    
    # Configuración de horarios
    HORARIO_APERTURA: str = "08:00"
    HORARIO_CIERRE: str = "24:00"
    
    # Configuración de precios por defecto
    PRECIO_BASQUET_POR_HORA: float = 26000.0
    PRECIO_VOLLEY_POR_HORA: float = 15000.0
    
    # Configuración de descuentos
    DESCUENTO_SUSCRIPCION: float = 5.0
    
    @classmethod
    def validate_configuration(cls) -> List[str]:
        """Validar configuración y retornar lista de errores"""
        errors = []
        
        if not cls.SECRET_KEY or cls.SECRET_KEY == "tu_clave_secreta_aqui_cambiala_en_produccion":
            errors.append("SECRET_KEY debe ser configurada en producción")
        
        if not cls.DATABASE_URL:
            errors.append("DATABASE_URL es requerida")
        
        # Validación opcional de Twilio
        # if not all([cls.TWILIO_ACCOUNT_SID, cls.TWILIO_AUTH_TOKEN, cls.TWILIO_PHONE_NUMBER]):
        #     errors.append("Configuración de Twilio incompleta - WhatsApp no disponible")
        
        # Validación opcional de Firebase
        if cls.FIREBASE_CREDENTIALS_PATH and not os.path.exists(cls.FIREBASE_CREDENTIALS_PATH):
            errors.append("Archivo de credenciales de Firebase no encontrado")
        
        return errors
    
    @classmethod
    def get_database_url(cls) -> str:
        """Obtener URL de base de datos con validación"""
        if not cls.DATABASE_URL:
            raise ValueError("DATABASE_URL no está configurada")
        return cls.DATABASE_URL
    
    @classmethod
    def get_secret_key(cls) -> str:
        """Obtener clave secreta con validación"""
        if not cls.SECRET_KEY or cls.SECRET_KEY == "tu_clave_secreta_aqui_cambiala_en_produccion":
            if os.getenv("ENVIRONMENT") == "production":
                raise ValueError("SECRET_KEY debe ser configurada en producción")
            else:
                print("Usando SECRET_KEY por defecto - NO USAR EN PRODUCCIÓN")
        return cls.SECRET_KEY

settings = Settings() 