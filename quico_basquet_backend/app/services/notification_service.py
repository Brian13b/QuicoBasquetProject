import logging
from typing import Dict, Any, List
from app.services.email_service import enviar_notificacion_masiva, email_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_whatsapp_message(telefono: str, mensaje: str) -> bool:
    """
    Envía mensaje por WhatsApp (placeholder - por ahora solo log)
    En el futuro se puede integrar con WhatsApp Business API
    """
    try:
        logger.info(f"WhatsApp enviado a {telefono}: {mensaje}")
        return True
    except Exception as e:
        logger.error(f"Error enviando WhatsApp a {telefono}: {e}")
        return False

class NotificationService:
    """Servicio para manejo de notificaciones"""
    
    @staticmethod
    def enviar_notificacion_automatica(
        tipo: str,
        asunto: str,
        mensaje: str,
        destinatarios: List[str]
    ) -> Dict[str, int]:
        """
        Envía notificación automática por email
        Retorna: {"exitosos": int, "fallidos": int}
        """
        try:
            logger.info(f"Enviando notificación automática: {tipo} - {asunto}")
            resultados = enviar_notificacion_masiva(destinatarios, asunto, mensaje, tipo)
            logger.info(f"Notificación automática enviada: {resultados['exitosos']} exitosos, {resultados['fallidos']} fallidos")
            return resultados
        except Exception as e:
            logger.error(f"Error enviando notificación automática: {e}")
            return {"exitosos": 0, "fallidos": len(destinatarios)}

    @staticmethod
    def enviar_notificacion_reserva_confirmada(
        email_usuario: str,
        datos_reserva: Dict[str, Any]
    ) -> bool:
        """
        Envía notificación de confirmación de reserva
        """
        try:
            from app.services.email_service import enviar_confirmacion_reserva
            
            datos_usuario = {
                "email": email_usuario,
                "nombre": datos_reserva.get("usuario_nombre", "Usuario")
            }
            
            return enviar_confirmacion_reserva(datos_usuario, datos_reserva)
        except Exception as e:
            logger.error(f"Error enviando confirmación de reserva: {e}")
            return False

    @staticmethod
    def enviar_notificacion_reserva_cancelada(
        email_usuario: str,
        datos_reserva: Dict[str, Any]
    ) -> bool:
        """
        Envía notificación de cancelación de reserva
        """
        try:
            from app.services.email_service import enviar_cancelacion_reserva
            
            datos_usuario = {
                "email": email_usuario,
                "nombre": datos_reserva.get("usuario_nombre", "Usuario")
            }
            
            return enviar_cancelacion_reserva(datos_usuario, datos_reserva)
        except Exception as e:
            logger.error(f"Error enviando cancelación de reserva: {e}")
            return False

    @staticmethod
    def enviar_notificacion_mantenimiento(
        emails_usuarios: List[str],
        fecha_mantenimiento: str,
        duracion: str = "2 horas"
    ) -> Dict[str, int]:
        """
        Envía notificación de mantenimiento programado
        """
        asunto = "Mantenimiento Programado - Canchas Temporariamente Cerradas"
        mensaje = f"""
Estimados usuarios,

Les informamos que las canchas estarán cerradas por mantenimiento programado:

Fecha: {fecha_mantenimiento}
Duración estimada: {duracion}

Durante este período no se podrán realizar reservas. Les pedimos disculpas por las molestias ocasionadas.

Una vez finalizado el mantenimiento, las canchas estarán disponibles nuevamente para sus reservas.

¡Gracias por su comprensión!

Saludos,
Quico Básquet
        """
        
        return NotificationService.enviar_notificacion_automatica(
            "mantenimiento", asunto, mensaje, emails_usuarios
        )

    @staticmethod
    def enviar_notificacion_promocion(
        emails_usuarios: List[str],
        descuento: str,
        fecha_inicio: str,
        fecha_fin: str,
        condiciones: str = ""
    ) -> Dict[str, int]:
        """
        Envía notificación de promoción especial
        """
        asunto = f"¡Promoción Especial! {descuento} de descuento"
        mensaje = f"""
¡Hola!

Tenemos una promoción especial para ti:

🎉 {descuento} de descuento en todas las reservas

📅 Válido desde: {fecha_inicio}
📅 Válido hasta: {fecha_fin}

{condiciones}

¡No te pierdas esta oportunidad! Reserva ahora y aprovecha el descuento.

Saludos,
Quico Básquet
        """
        
        return NotificationService.enviar_notificacion_automatica(
            "promocion", asunto, mensaje, emails_usuarios
        )

    @staticmethod
    def enviar_notificacion_recordatorio(
        email_usuario: str,
        datos_reserva: Dict[str, Any]
    ) -> bool:
        """
        Envía recordatorio de reserva próxima
        """
        try:
            asunto = f"Recordatorio: Tu reserva es hoy a las {datos_reserva['hora_inicio']}"
            mensaje = f"""
Hola {datos_reserva['usuario_nombre']},

Te recordamos que tienes una reserva programada para hoy:

📅 Fecha: {datos_reserva['fecha']}
🕐 Hora: {datos_reserva['hora_inicio']} - {datos_reserva['hora_fin']}
🏀 Cancha: {datos_reserva['cancha_nombre']}
🏃 Deporte: {datos_reserva['deporte']}

¡Te esperamos!

Saludos,
Quico Básquet
            """
            
            return email_service.enviar_email(email_usuario, asunto, mensaje, mensaje)
        except Exception as e:
            logger.error(f"Error enviando recordatorio de reserva: {e}")
            return False

    @staticmethod
    def enviar_notificacion_suscripcion_vencida(
        email_usuario: str,
        datos_suscripcion: Dict[str, Any]
    ) -> bool:
        """
        Envía notificación de suscripción vencida
        """
        try:
            asunto = "Tu suscripción ha vencido"
            mensaje = f"""
Hola {datos_suscripcion['usuario_nombre']},

Tu suscripción ha vencido el {datos_suscripcion['fecha_vencimiento']}.

Para continuar disfrutando de nuestros servicios, por favor renueva tu suscripción.

Saludos,
Quico Básquet
            """
            
            return email_service.enviar_email(email_usuario, asunto, mensaje, mensaje)
        except Exception as e:
            logger.error(f"Error enviando notificación de suscripción vencida: {e}")
            return False 