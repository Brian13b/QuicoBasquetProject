from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.data.database import get_db
from app.services.auth_service import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationOut, NotificationHistory
from app.crud.notification import (
    crear_notificacion, 
    actualizar_resultados_notificacion, 
    obtener_historial_notificaciones
)
from app.services.email_service import enviar_notificacion_masiva
from typing import List

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.post("/send", response_model=dict)
def enviar_notificacion(
    notification_data: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enviar notificación masiva por email (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden enviar notificaciones.")
    
    try:
        # Crear registro en el historial
        db_notification = crear_notificacion(db, notification_data, current_user.id)
        
        # Determinar destinatarios
        if notification_data.destinatarios == "todos":
            usuarios = db.query(User).filter(User.email.isnot(None)).all()
        elif notification_data.destinatarios == "activos":
            # Usuarios que han hecho reservas en los últimos 30 días
            from datetime import datetime, timedelta
            from app.models.reserva import Reserva
            
            fecha_limite = datetime.now() - timedelta(days=30)
            usuarios_activos = db.query(Reserva.user_id).filter(
                Reserva.fecha >= fecha_limite.date()
            ).distinct().all()
            
            user_ids = [u[0] for u in usuarios_activos]
            usuarios = db.query(User).filter(
                User.id.in_(user_ids),
                User.email.isnot(None)
            ).all()
        elif notification_data.destinatarios == "especifico":
            if not notification_data.usuario_id_especifico:
                raise HTTPException(status_code=400, detail="ID de usuario requerido para notificación específica")
            usuario = db.query(User).filter(User.id == notification_data.usuario_id_especifico).first()
            if not usuario:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            if not usuario.email:
                raise HTTPException(status_code=400, detail="El usuario no tiene email registrado")
            usuarios = [usuario]
        else:
            raise HTTPException(status_code=400, detail="Tipo de destinatarios inválido")
        
        # Obtener emails de destinatarios
        emails_destinatarios = [usuario.email for usuario in usuarios if usuario.email]
        
        if not emails_destinatarios:
            # Actualizar notificación como fallida
            actualizar_resultados_notificacion(
                db, db_notification.id, 0, 0, 0, "error"
            )
            raise HTTPException(status_code=400, detail="No hay destinatarios con email válido")
        
        # Enviar notificaciones por email
        resultados = enviar_notificacion_masiva(
            emails_destinatarios, 
            notification_data.asunto, 
            notification_data.mensaje, 
            notification_data.tipo
        )
        
        # Actualizar resultados en la base de datos
        actualizar_resultados_notificacion(
            db, 
            db_notification.id, 
            resultados["exitosos"], 
            resultados["fallidos"], 
            len(emails_destinatarios),
            "enviado"
        )
        
        return {
            "mensaje": "Notificación enviada exitosamente",
            "enviados_exitosos": resultados["exitosos"],
            "enviados_fallidos": resultados["fallidos"],
            "total_destinatarios": len(emails_destinatarios),
            "notification_id": db_notification.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Si hay error, actualizar el estado
        if 'db_notification' in locals():
            actualizar_resultados_notificacion(
                db, db_notification.id, 0, 0, 0, "error"
            )
        raise HTTPException(status_code=500, detail=f"Error al enviar notificaciones: {str(e)}")

@router.get("/history", response_model=List[NotificationHistory])
def obtener_historial_notificaciones_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener historial de notificaciones (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden ver el historial.")
    
    try:
        notificaciones = obtener_historial_notificaciones(db, limit=50)
        return notificaciones
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener historial: {str(e)}")

@router.get("/stats", response_model=dict)
def obtener_estadisticas_notificaciones(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener estadísticas de notificaciones (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden ver estadísticas.")
    
    try:
        from sqlalchemy import func
        from app.models.notification import Notification
        
        # Estadísticas generales
        total_notificaciones = db.query(func.count(Notification.id)).scalar()
        total_enviados = db.query(func.sum(Notification.enviados_exitosos)).scalar() or 0
        total_fallidos = db.query(func.sum(Notification.enviados_fallidos)).scalar() or 0
        
        # Notificaciones por tipo
        notificaciones_por_tipo = db.query(
            Notification.tipo,
            func.count(Notification.id).label('cantidad')
        ).group_by(Notification.tipo).all()
        
        # Últimas 7 notificaciones
        ultimas_notificaciones = db.query(Notification).order_by(
            Notification.fecha_envio.desc()
        ).limit(7).all()
        
        return {
            "total_notificaciones": total_notificaciones,
            "total_enviados": total_enviados,
            "total_fallidos": total_fallidos,
            "tasa_exito": (total_enviados / (total_enviados + total_fallidos) * 100) if (total_enviados + total_fallidos) > 0 else 0,
            "por_tipo": {tipo: cantidad for tipo, cantidad in notificaciones_por_tipo},
            "ultimas_notificaciones": [
                {
                    "id": n.id,
                    "tipo": n.tipo,
                    "asunto": n.asunto,
                    "fecha_envio": n.fecha_envio,
                    "enviados_exitosos": n.enviados_exitosos,
                    "estado": n.estado
                }
                for n in ultimas_notificaciones
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}") 