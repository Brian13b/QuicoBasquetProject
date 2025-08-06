import logging
from app.config.settings import settings

logger = logging.getLogger(__name__)

def send_whatsapp_message(telefono: str, mensaje: str) -> bool:
    """
    Envía un mensaje de WhatsApp (simulado por ahora)
    En producción, aquí se integraría con Twilio o similar
    """
    try:
        # Verificar si Twilio está configurado
        if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
            logger.warning("Twilio no configurado - mensaje simulado")
            logger.info(f"📱 Mensaje simulado a {telefono}: {mensaje}")
            return True
        
        # Aquí iría la integración real con Twilio
        # from twilio.rest import Client
        # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        # message = client.messages.create(
        #     body=mensaje,
        #     from_=settings.TWILIO_PHONE_NUMBER,
        #     to=f"whatsapp:{telefono}"
        # )
        
        logger.info(f"📱 Mensaje enviado a {telefono}: {mensaje}")
        return True
        
    except Exception as e:
        logger.error(f"Error al enviar mensaje de WhatsApp: {e}")
        return False 