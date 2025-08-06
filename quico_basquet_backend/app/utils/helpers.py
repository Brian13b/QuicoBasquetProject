import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.services.notification_service import NotificationService
from app.services.email_service import email_service

logger = logging.getLogger(__name__)

def enviar_notificacion_reserva_creada(reserva_data: Dict[str, Any]) -> bool:
    """
    Envía notificación cuando se crea una reserva
    """
    try:
        notification_service = NotificationService()
        
        # Preparar datos para la notificación
        datos_reserva = {
            "usuario_nombre": reserva_data.get("usuario_nombre", "Usuario"),
            "fecha": reserva_data.get("fecha"),
            "hora_inicio": reserva_data.get("hora_inicio"),
            "hora_fin": reserva_data.get("hora_fin"),
            "cancha_nombre": reserva_data.get("cancha_nombre"),
            "deporte": reserva_data.get("deporte"),
            "precio": reserva_data.get("precio")
        }
        
        # Enviar notificación por email
        datos_usuario = {
            "email": reserva_data.get("usuario_email"),
            "nombre": reserva_data.get("usuario_nombre", "Usuario")
        }
        
        if datos_usuario["email"]:
            return notification_service.enviar_notificacion_reserva_confirmada(
                datos_usuario["email"], datos_reserva
            )
        
        return True
        
    except Exception as e:
        logger.error(f"Error enviando notificación de reserva: {e}")
        return False

def enviar_notificacion_reserva_cancelada(reserva_data: Dict[str, Any]) -> bool:
    """
    Envía notificación cuando se cancela una reserva
    """
    try:
        notification_service = NotificationService()
        
        # Preparar datos para la notificación
        datos_reserva = {
            "usuario_nombre": reserva_data.get("usuario_nombre", "Usuario"),
            "fecha": reserva_data.get("fecha"),
            "hora_inicio": reserva_data.get("hora_inicio"),
            "hora_fin": reserva_data.get("hora_fin"),
            "cancha_nombre": reserva_data.get("cancha_nombre"),
            "deporte": reserva_data.get("deporte")
        }
        
        # Enviar notificación por email
        datos_usuario = {
            "email": reserva_data.get("usuario_email"),
            "nombre": reserva_data.get("usuario_nombre", "Usuario")
        }
        
        if datos_usuario["email"]:
            return notification_service.enviar_notificacion_reserva_cancelada(
                datos_usuario["email"], datos_reserva
            )
        
        return True
        
    except Exception as e:
        logger.error(f"Error enviando notificación de reserva: {e}")
        return False

def enviar_notificacion_suscripcion_vencida(suscripcion_data: Dict[str, Any]) -> bool:
    """
    Envía notificación cuando vence una suscripción
    """
    try:
        notification_service = NotificationService()
        
        # Preparar datos para la notificación
        datos_suscripcion = {
            "usuario_nombre": suscripcion_data.get("usuario_nombre", "Usuario"),
            "fecha_vencimiento": suscripcion_data.get("fecha_vencimiento")
        }
        
        # Enviar notificación por email
        datos_usuario = {
            "email": suscripcion_data.get("usuario_email"),
            "nombre": suscripcion_data.get("usuario_nombre", "Usuario")
        }
        
        if datos_usuario["email"]:
            return notification_service.enviar_notificacion_suscripcion_vencida(
                datos_usuario["email"], datos_suscripcion
            )
        
        return True
        
    except Exception as e:
        logger.error(f"Error enviando notificación de suscripción: {e}")
        return False

def formatear_fecha(fecha: datetime) -> str:
    """
    Formatea una fecha para mostrar en español
    """
    meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ]
    
    return f"{fecha.day} de {meses[fecha.month - 1]} de {fecha.year}"

def formatear_hora(hora: datetime) -> str:
    """
    Formatea una hora para mostrar
    """
    return hora.strftime("%H:%M")

def calcular_edad(fecha_nacimiento: datetime) -> int:
    """
    Calcula la edad basada en la fecha de nacimiento
    """
    hoy = datetime.now()
    edad = hoy.year - fecha_nacimiento.year
    
    if (hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day):
        edad -= 1
    
    return edad

def validar_email(email: str) -> bool:
    """
    Valida formato básico de email
    """
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validar_telefono(telefono: str) -> bool:
    """
    Valida formato básico de teléfono argentino
    """
    import re
    # Patrón para teléfonos argentinos (con o sin código de país)
    pattern = r'^(\+54\s?)?(9\s?)?(\d{1,4}\s?)?(\d{6,8})$'
    return re.match(pattern, telefono) is not None

def sanitizar_texto(texto: str) -> str:
    """
    Sanitiza texto para evitar inyección de HTML
    """
    import html
    return html.escape(texto)

def log_operacion(operation: str, user_id: int, details: str = ""):
    """
    Registra una operación en el log
    """
    logger.info(f"{operation} - Usuario: {user_id} - {details}")

def handle_database_error(error: Exception, operation: str) -> str:
    """
    Manejo centralizado de errores de base de datos
    """
    logger.error(f"Error en {operation}: {error}")
    
    error_str = str(error).lower()
    
    if "duplicate key" in error_str:
        return "Ya existe un registro con esos datos"
    elif "foreign key" in error_str:
        return "Referencia inválida en la base de datos"
    elif "not null" in error_str:
        return "Faltan datos requeridos"
    else:
        return "Error interno del servidor"

def generar_codigo_verificacion() -> str:
    """
    Genera un código de verificación de 6 dígitos
    """
    import random
    return str(random.randint(100000, 999999))

def es_fecha_futura(fecha: datetime) -> bool:
    """
    Verifica si una fecha es futura
    """
    return fecha > datetime.now()

def es_fecha_pasada(fecha: datetime) -> bool:
    """
    Verifica si una fecha es pasada
    """
    return fecha < datetime.now()

def obtener_dia_semana(fecha: datetime) -> str:
    """
    Obtiene el nombre del día de la semana en español
    """
    dias = [
        "lunes", "martes", "miércoles", "jueves", 
        "viernes", "sábado", "domingo"
    ]
    return dias[fecha.weekday()]

def formatear_precio(precio: float) -> str:
    """
    Formatea un precio para mostrar
    """
    return f"${precio:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") 