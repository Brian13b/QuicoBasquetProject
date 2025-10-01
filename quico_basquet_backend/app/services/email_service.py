import smtplib
import logging
import sendgrid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from app.config.settings import settings
from sendgrid.helpers.mail import Mail, From, To, Subject, PlainTextContent, HtmlContent

logger = logging.getLogger(__name__)

def send_with_sendgrid_api(to_email: str, subject: str, message: str) -> bool:
    """
    Envía un email usando SendGrid API 
    """
    try:
        if not settings.SENDGRID_API_KEY:
            logger.error("SendGrid API Key no configurada")
            return False
        
        # Configurar SendGrid
        sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        
        # Crear el mensaje
        from_email = From(settings.FROM_EMAIL, settings.FROM_NAME)
        to_email_obj = To(to_email)
        subject_obj = Subject(subject)
        
        # Convertir texto plano a HTML básico
        html_message = message.replace('\n', '<br>')
        
        content = HtmlContent(f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; border-bottom: 2px solid #4a90e2; padding-bottom: 20px; margin-bottom: 20px;">
                    <h1 style="color: #4a90e2; margin: 0;">{settings.FROM_NAME}</h1>
                </div>
                <div style="white-space: pre-wrap;">
                    {html_message}
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 0.9em;">
                    <p>Este es un mensaje automático, por favor no responder a este email.</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        mail = Mail(from_email, to_email_obj, subject_obj, content)
        
        # Enviar el email
        response = sg.send(mail)
        
        if response.status_code in [200, 202]:
            logger.info(f"📧 Email enviado via SendGrid a {to_email}: {subject}")
            return True
        else:
            logger.error(f"SendGrid falló con código: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"Error al enviar email via SendGrid: {e}")
        return False

def send_with_smtp(to_email: str, subject: str, message: str) -> bool:
    """
    Envía un email usando Gmail SMTP (puede fallar en Render)
    """
    try:
        # Verificar si Gmail está configurado
        if not settings.GMAIL_APP_PASSWORD:
            logger.warning("Gmail SMTP no configurado")
            return False
        
        # Configurar el mensaje
        msg = MIMEMultipart()
        msg['From'] = settings.GMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = Header(subject, 'utf-8')
        
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
        
        logger.info(f"📧 Email enviado via SMTP a {to_email}: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"Error al enviar email via SMTP: {e}")
        return False

def send_email(to_email: str, subject: str, message: str) -> bool:
    """
    Envía un email usando SendGrid API como método principal, con SMTP como fallback
    Ideal para despliegues en Render donde SMTP puede estar bloqueado
    """
    logger.info(f"🚀 Iniciando envío de email a {to_email}: {subject}")
    
    # 1. Intentar SendGrid API primero (recomendado para Render)
    if settings.SENDGRID_API_KEY:
        logger.info("📡 Intentando envío via SendGrid API...")
        if send_with_sendgrid_api(to_email, subject, message):
            return True
        else:
            logger.warning("⚠️ SendGrid API falló, intentando SMTP...")
    else:
        logger.info("📡 SendGrid no configurado, intentando SMTP...")
    
    # 2. Fallback a SMTP si SendGrid falla
    if send_with_smtp(to_email, subject, message):
        return True
    
    # 3. Si ambos fallan, simular envío en desarrollo
    if not settings.SENDGRID_API_KEY and not settings.GMAIL_APP_PASSWORD:
        logger.warning("📧 Ningún servicio de email configurado - simulando envío")
        logger.info(f"📧 Email simulado a {to_email}: {subject} - {message[:100]}...")
        return True
    
    # 4. Si todo falla
    logger.error(f"❌ Falló el envío de email a {to_email}")
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

© 2025 Quico Básquet. Todos los derechos reservados.
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

def send_subscription_confirmation_email_admin(user_name: str, suscripcion_data: dict) -> bool:
    """
    Envía email de confirmación de suscripción al administrador
    """
    subject = "✅ Nueva Suscripción Creada - Quico Básquet"
    
    # Convertir número de día a nombre
    dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    dia_nombre = dias_semana[suscripcion_data['dia_semana']] if 0 <= suscripcion_data['dia_semana'] < 7 else f"Día {suscripcion_data['dia_semana']}"
    
    message = f"""
🔄 NUEVA SUSCRIPCIÓN CREADA

📅 Día de la semana: {dia_nombre}
⏰ Horario: {suscripcion_data['hora_inicio']} - {suscripcion_data['hora_fin']}
🏀 Deporte: {suscripcion_data['deporte']}
👤 Cliente: {suscripcion_data['cliente_nombre']}
💰 Precio mensual: ${suscripcion_data['precio_mensual']}
📅 Fecha inicio: {suscripcion_data.get('fecha_inicio', 'No especificada')}
📅 Fecha fin: {suscripcion_data.get('fecha_fin', 'No especificada')}

📍 Creada por: {user_name}

¡Nueva suscripción confirmada en el sistema!
    """
    
    return send_email("basquetquico@gmail.com", subject, message)

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

def send_subscription_cancellation_email_admin(user_name: str, suscripcion_data: dict) -> bool:
    """
    Envía email de cancelación de suscripción al administrador
    """
    subject = "❌ Suscripción Cancelada - Quico Básquet"
    
    # Convertir número de día a nombre
    dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    dia_nombre = dias_semana[suscripcion_data['dia_semana']] if 0 <= suscripcion_data['dia_semana'] < 7 else f"Día {suscripcion_data['dia_semana']}"
    
    message = f"""
❌ SUSCRIPCIÓN CANCELADA

📅 Día de la semana: {dia_nombre}
⏰ Horario: {suscripcion_data['hora_inicio']} - {suscripcion_data['hora_fin']}
🏀 Deporte: {suscripcion_data['deporte']}
👤 Cliente: {suscripcion_data['cliente_nombre']}
💰 Precio mensual: ${suscripcion_data['precio_mensual']}

📍 Cancelada por: {user_name}

⚠️ Suscripción cancelada en el sistema.
    """
    
    return send_email("basquetquico@gmail.com", subject, message)

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

def send_reservation_confirmation_email_admin(user_name: str, reserva_data: dict, info_pago: dict) -> bool:
    """
    Envía email de confirmación de reserva al administrador
    """
    subject = "✅ Confirmación de Reserva - Quico Básquet"
    
    if info_pago['metodo'] == 'transferencia':
        message = f"""
🏀 NUEVA RESERVA CREADA

📅 Fecha: {reserva_data['fecha']}
⏰ Horario: {reserva_data['hora_inicio']} - {reserva_data['hora_fin']}
🏀 Deporte: {reserva_data['deporte']}
👤 Cliente: {reserva_data['cliente_nombre']}
💰 Precio: ${reserva_data['precio']}
💳 Método pago: Transferencia

📍 Creada por: {user_name}

¡Nueva reserva confirmada en el sistema!
        """
    else:
        message = f"""
🏀 NUEVA RESERVA CREADA

📅 Fecha: {reserva_data['fecha']}
⏰ Horario: {reserva_data['hora_inicio']} - {reserva_data['hora_fin']}
🏀 Deporte: {reserva_data['deporte']}
👤 Cliente: {reserva_data['cliente_nombre']}
💰 Precio: ${reserva_data['precio']}
💳 Método pago: Efectivo

📍 Creada por: {user_name}

¡Nueva reserva confirmada en el sistema!
        """

    return send_email("basquetquico@gmail.com", subject, message)

def send_reservation_cancellation_email_admin(user_name: str, reserva_data: dict) -> bool:
    """
    Envía email de cancelación de reserva al administrador
    """
    subject = "❌ Reserva Cancelada - Quico Básquet"
    
    message = f"""
🏀 RESERVA CANCELADA

📅 Fecha: {reserva_data['fecha']}
⏰ Horario: {reserva_data['hora_inicio']} - {reserva_data['hora_fin']}
🏀 Deporte: {reserva_data['deporte']}
👤 Cliente: {reserva_data['cliente_nombre']}
💰 Precio: ${reserva_data['precio']}
    """

    return send_email("basquetquico@gmail.com", subject, message)