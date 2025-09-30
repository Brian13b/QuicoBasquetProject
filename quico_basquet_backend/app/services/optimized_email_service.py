import requests
import logging
from typing import Dict, Any, Optional
from app.config.settings import settings

logger = logging.getLogger(__name__)

class SendGridEmailService:
    """
    Servicio de email usando SendGrid API (recomendado por Render)
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'SENDGRID_API_KEY', None)
        self.from_email = getattr(settings, 'FROM_EMAIL', 'noreply@quicobasquet.com')
        self.base_url = "https://api.sendgrid.com/v3/mail/send"
        
    def send_email(self, to_email: str, subject: str, message: str, html_message: Optional[str] = None) -> bool:
        """
        Envía un email usando SendGrid API
        """
        try:
            if not self.api_key:
                logger.warning("SendGrid no configurado - email simulado")
                logger.info(f"📧 Email simulado a {to_email}: {subject}")
                return True
            
            # Preparar payload para SendGrid
            payload = {
                "personalizations": [
                    {
                        "to": [{"email": to_email}],
                        "subject": subject
                    }
                ],
                "from": {"email": self.from_email, "name": "Quico Básquet"},
                "content": [
                    {
                        "type": "text/plain",
                        "value": message
                    }
                ]
            }
            
            # Agregar HTML si está disponible
            if html_message:
                payload["content"].append({
                    "type": "text/html", 
                    "value": html_message
                })
            
            # Headers para la API
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # 🚀 ENVÍO CON TIMEOUT CORTO
            response = requests.post(
                self.base_url,
                json=payload,
                headers=headers,
                timeout=10  # Timeout de 10 segundos
            )
            
            if response.status_code == 202:
                logger.info(f"✅ Email enviado exitosamente a {to_email}")
                return True
            else:
                logger.error(f"❌ Error SendGrid: {response.status_code} - {response.text}")
                return False
                
        except requests.RequestException as e:
            logger.error(f"❌ Error de conexión SendGrid: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Error inesperado al enviar email: {e}")
            return False


class BackupEmailService:
    """
    Servicio de email de respaldo usando SMTP con timeouts cortos
    """
    
    def send_email(self, to_email: str, subject: str, message: str) -> bool:
        """
        Envía email con SMTP optimizado para Render
        """
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from email.header import Header
        import socket
        
        try:
            if not settings.GMAIL_APP_PASSWORD:
                logger.warning("SMTP no configurado - email simulado")
                return True
            
            # Configurar timeout del socket
            socket.setdefaulttimeout(15)  # 15 segundos máximo
            
            msg = MIMEMultipart()
            msg['From'] = settings.GMAIL_USER
            msg['To'] = to_email
            msg['Subject'] = Header(subject, 'utf-8')
            msg.attach(MIMEText(message, 'plain', 'utf-8'))
            
            # Conexión SMTP con timeout
            server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
            server.starttls()
            server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
            
            text = msg.as_string()
            server.sendmail(settings.GMAIL_USER, to_email, text)
            server.quit()
            
            logger.info(f"✅ Email SMTP enviado a {to_email}")
            return True
            
        except smtplib.SMTPException as e:
            logger.error(f"❌ Error SMTP: {e}")
            return False
        except socket.timeout:
            logger.error(f"❌ Timeout SMTP para {to_email}")
            return False
        except Exception as e:
            logger.error(f"❌ Error SMTP inesperado: {e}")
            return False


class OptimizedEmailService:
    """
    Servicio de email optimizado que usa SendGrid como primario y SMTP como backup
    """
    
    def __init__(self):
        self.sendgrid_service = SendGridEmailService()
        self.backup_service = BackupEmailService()
        
    def send_email(self, to_email: str, subject: str, message: str, html_message: Optional[str] = None) -> bool:
        """
        Envía email con fallback automático
        """
        logger.info(f"📧 Enviando email a {to_email}: {subject}")
        
        # Intentar con SendGrid primero
        if self.sendgrid_service.send_email(to_email, subject, message, html_message):
            return True
        
        # Si falla, usar SMTP como backup
        logger.warning("SendGrid falló, intentando con SMTP backup...")
        return self.backup_service.send_email(to_email, subject, message)
    
    def send_bulk_emails(self, email_list: list) -> Dict[str, int]:
        """
        Envía emails en lote de forma optimizada
        """
        exitosos = 0
        fallidos = 0
        
        for email_data in email_list:
            try:
                success = self.send_email(
                    email_data['to_email'],
                    email_data['subject'],
                    email_data['message'],
                    email_data.get('html_message')
                )
                
                if success:
                    exitosos += 1
                else:
                    fallidos += 1
                    
            except Exception as e:
                logger.error(f"❌ Error en envío bulk: {e}")
                fallidos += 1
        
        return {"exitosos": exitosos, "fallidos": fallidos}


# Instancia global del servicio optimizado
optimized_email_service = OptimizedEmailService()


def send_email_optimized(to_email: str, subject: str, message: str, html_message: Optional[str] = None) -> bool:
    """
    Función helper para envío optimizado de emails
    """
    return optimized_email_service.send_email(to_email, subject, message, html_message)