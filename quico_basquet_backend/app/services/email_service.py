import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config.settings import settings

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, message: str) -> bool:
    """
    Envía un email usando Gmail SMTP
    """
    try:
        # Verificar si Gmail está configurado
        if not settings.GMAIL_APP_PASSWORD:
            logger.warning("Gmail no configurado - email simulado")
            logger.info(f"📧 Email simulado a {to_email}: {subject} - {message}")
            return True
        
        # Configurar el mensaje
        msg = MIMEMultipart()
        msg['From'] = settings.GMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Agregar el cuerpo del mensaje con codificación UTF-8
        msg.attach(MIMEText(message, 'plain', 'utf-8'))
        
        # Conectar al servidor SMTP de Gmail
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
        
        # Enviar el email
        text = msg.as_string()
        server.sendmail(settings.GMAIL_USER, to_email, text)
        server.quit()
        
        logger.info(f"📧 Email enviado a {to_email}: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"Error al enviar email: {e}")
        return False

def enviar_notificacion_masiva(destinatarios: list, asunto: str, mensaje: str, tipo: str = "general") -> dict:
    """
    Envía notificación masiva por email
    Retorna: {"exitosos": int, "fallidos": int}
    """
    exitosos = 0
    fallidos = 0
    
    for destinatario in destinatarios:
        try:
            # Crear mensaje personalizado según el tipo
            mensaje_personalizado = crear_template_notificacion(tipo, mensaje)
            
            if send_email(destinatario, asunto, mensaje_personalizado):
                exitosos += 1
            else:
                fallidos += 1
                
        except Exception as e:
            logger.error(f"Error enviando email a {destinatario}: {e}")
            fallidos += 1
    
    logger.info(f"Notificación masiva completada: {exitosos} exitosos, {fallidos} fallidos")
    return {"exitosos": exitosos, "fallidos": fallidos}

def crear_template_notificacion(tipo: str, mensaje: str) -> str:
    """
    Crea un template para el email basado en el tipo
    """
    # Configuración de emojis por tipo
    tipo_config = {
        "general": {"emoji": "📢", "titulo": "Notificación General"},
        "mantenimiento": {"emoji": "🔧", "titulo": "Mantenimiento"},
        "promocion": {"emoji": "🎉", "titulo": "Promoción Especial"},
        "reserva": {"emoji": "🏀", "titulo": "Información de Reserva"},
        "suscripcion": {"emoji": "📅", "titulo": "Información de Suscripción"}
    }
    
    config = tipo_config.get(tipo, tipo_config["general"])
    
    template = f"""
{config['emoji']} {config['titulo']} - Quico Básquet

{mensaje}

---
¿Necesitas ayuda? Contacta con nosotros:
Email: basquetquico@gmail.com

© 2024 Quico Básquet. Todos los derechos reservados.
    """
    
    return template

def send_reservation_confirmation_email(user_email: str, user_name: str, reserva_data: dict, info_pago: dict) -> bool:
    """
    Envía email de confirmación de reserva
    """
    subject = "✅ Confirmación de Reserva - Quico Básquet"
    
    if info_pago['metodo'] == 'transferencia':
        message = f"""
¡Hola {user_name}!

Tu reserva ha sido confirmada exitosamente.

📅 Fecha: {reserva_data['fecha']}
⏰ Horario: {reserva_data['hora_inicio']} - {reserva_data['hora_fin']}
🏀 Deporte: {reserva_data['deporte']}
💰 Precio: ${reserva_data['precio']}

💳 INFORMACIÓN DE PAGO:
• Método: Transferencia bancaria
• Alias: {info_pago['alias']}
• CBU: {info_pago['cbu']}
• Banco: {info_pago['banco']}
• Titular: {info_pago['titular']}

Por favor, realiza la transferencia antes de la fecha de la reserva.

¡Gracias por elegir Quico Básquet!

Saludos,
El equipo de Quico Básquet
        """
    else:
        message = f"""
¡Hola {user_name}!

Tu reserva ha sido confirmada exitosamente.

📅 Fecha: {reserva_data['fecha']}
⏰ Horario: {reserva_data['hora_inicio']} - {reserva_data['hora_fin']}
🏀 Deporte: {reserva_data['deporte']}
💰 Precio: ${reserva_data['precio']}

💵 PAGO EN EFECTIVO:
El pago se realiza en efectivo al momento de la reserva.

¡Gracias por elegir Quico Básquet!

Saludos,
El equipo de Quico Básquet
        """
    
    return send_email(user_email, subject, message)

def send_subscription_confirmation_email(user_email: str, user_name: str, suscripcion_data: dict) -> bool:
    """
    Envía email de confirmación de suscripción
    """
    subject = "✅ Confirmación de Suscripción - Quico Básquet"
    
    # Convertir número de día a nombre
    dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    dia_nombre = dias_semana[suscripcion_data['dia_semana']] if 0 <= suscripcion_data['dia_semana'] < 7 else f"Día {suscripcion_data['dia_semana']}"
    
    message = f"""
¡Hola {user_name}!

Tu suscripción ha sido creada exitosamente.

📅 Día de la semana: {dia_nombre}
⏰ Horario: {suscripcion_data['hora_inicio']} - {suscripcion_data['hora_fin']}
🏀 Deporte: {suscripcion_data['deporte']}
💰 Precio mensual: ${suscripcion_data['precio_mensual']}

Tu suscripción está activa y puedes disfrutar de tu cancha reservada.

¡Gracias por elegir Quico Básquet!

Saludos,
El equipo de Quico Básquet
    """
    
    return send_email(user_email, subject, message)

def send_subscription_cancellation_email(user_email: str, user_name: str, suscripcion_data: dict) -> bool:
    """
    Envía email de cancelación de suscripción
    """
    subject = "❌ Suscripción Cancelada - Quico Básquet"
    
    # Convertir número de día a nombre
    dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    dia_nombre = dias_semana[suscripcion_data['dia_semana']] if 0 <= suscripcion_data['dia_semana'] < 7 else f"Día {suscripcion_data['dia_semana']}"
    
    message = f"""
¡Hola {user_name}!

Tu suscripción ha sido cancelada.

📅 Día de la semana: {dia_nombre}
⏰ Horario: {suscripcion_data['hora_inicio']} - {suscripcion_data['hora_fin']}
🏀 Deporte: {suscripcion_data['deporte']}

Si tienes alguna pregunta o deseas reactivar tu suscripción, no dudes en contactarnos.

¡Gracias por haber elegido Quico Básquet!

Saludos,
El equipo de Quico Básquet
    """
    
    return send_email(user_email, subject, message)

def send_subscription_renewal_email(user_email: str, user_name: str, suscripcion_data: dict, nueva_fecha_fin: str) -> bool:
    """
    Envía email de renovación de suscripción
    """
    subject = "🔄 Suscripción Renovada - Quico Básquet"
    
    # Convertir número de día a nombre
    dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    dia_nombre = dias_semana[suscripcion_data['dia_semana']] if 0 <= suscripcion_data['dia_semana'] < 7 else f"Día {suscripcion_data['dia_semana']}"
    
    message = f"""
¡Hola {user_name}!

Tu suscripción ha sido renovada exitosamente.

📅 Día de la semana: {dia_nombre}
⏰ Horario: {suscripcion_data['hora_inicio']} - {suscripcion_data['hora_fin']}
🏀 Deporte: {suscripcion_data['deporte']}
💰 Precio mensual: ${suscripcion_data['precio_mensual']}
📅 Nueva fecha de fin: {nueva_fecha_fin}

Tu suscripción está activa y puedes seguir disfrutando de tu cancha reservada.

¡Gracias por elegir Quico Básquet!

Saludos,
El equipo de Quico Básquet
    """
    
    return send_email(user_email, subject, message)

def send_reservation_cancellation_email(user_email: str, user_name: str, reserva_data: dict) -> bool:
    """
    Envía email de cancelación de reserva
    """
    subject = "❌ Reserva Cancelada - Quico Básquet"
    
    message = f"""
¡Hola {user_name}!

Tu reserva ha sido cancelada.

📅 Fecha: {reserva_data['fecha']}
⏰ Horario: {reserva_data['hora_inicio']} - {reserva_data['hora_fin']}
🏀 Deporte: {reserva_data['deporte']}

Si tienes alguna pregunta o deseas hacer una nueva reserva, no dudes en contactarnos.

¡Gracias por haber elegido Quico Básquet!

Saludos,
El equipo de Quico Básquet
    """
    
    return send_email(user_email, subject, message)
