from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate
from typing import List, Optional

def crear_notificacion(db: Session, notification_data: NotificationCreate, admin_id: int) -> Notification:
    """Crear una nueva notificación en el historial"""
    db_notification = Notification(
        tipo=notification_data.tipo,
        asunto=notification_data.asunto,
        mensaje=notification_data.mensaje,
        destinatarios=notification_data.destinatarios,
        usuario_id_especifico=notification_data.usuario_id_especifico,
        enviado_por=admin_id
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def actualizar_resultados_notificacion(
    db: Session, 
    notification_id: int, 
    enviados_exitosos: int, 
    enviados_fallidos: int, 
    total_destinatarios: int,
    estado: str = "enviado"
) -> Notification:
    """Actualizar los resultados del envío de una notificación"""
    db_notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if db_notification:
        db_notification.enviados_exitosos = enviados_exitosos
        db_notification.enviados_fallidos = enviados_fallidos
        db_notification.total_destinatarios = total_destinatarios
        db_notification.estado = estado
        db.commit()
        db.refresh(db_notification)
    return db_notification

def obtener_historial_notificaciones(db: Session, limit: int = 50) -> List[Notification]:
    """Obtener historial de notificaciones ordenado por fecha más reciente"""
    return db.query(Notification).order_by(Notification.fecha_envio.desc()).limit(limit).all()

def obtener_notificacion_por_id(db: Session, notification_id: int) -> Optional[Notification]:
    """Obtener una notificación específica por ID"""
    return db.query(Notification).filter(Notification.id == notification_id).first()

def obtener_notificaciones_por_tipo(db: Session, tipo: str, limit: int = 20) -> List[Notification]:
    """Obtener notificaciones por tipo"""
    return db.query(Notification).filter(Notification.tipo == tipo).order_by(Notification.fecha_envio.desc()).limit(limit).all() 