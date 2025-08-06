from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.reserva import Reserva
from app.models.user import User
from app.services.email_service import send_email
from app.data.database import get_db
from app.services.auth_service import require_admin
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])

class UserListItem(BaseModel):
    id: int
    nombre: str
    email: str
    telefono: str = None

@router.get("/usuarios", response_model=List[UserListItem])
def obtener_lista_usuarios(db: Session = Depends(get_db), admin=Depends(require_admin)):
    """Obtener lista de usuarios para el selector de notificaciones"""
    usuarios = db.query(User).filter(User.rol != "admin").all()
    return [
        UserListItem(
            id=user.id,
            nombre=user.nombre,
            email=user.email,
            telefono=user.telefono
        )
        for user in usuarios
    ]

@router.post("/enviar-recordatorios")
def enviar_recordatorios_reservas(db: Session = Depends(get_db), admin=Depends(require_admin)):
    ahora = datetime.now()
    en_una_hora = ahora + timedelta(hours=1)
    reservas = db.query(Reserva).filter(
        Reserva.fecha == en_una_hora.date(),
        Reserva.hora_inicio == en_una_hora.time().replace(second=0, microsecond=0),
        Reserva.estado == "pagada"
    ).all()
    enviados = 0
    for reserva in reservas:
        user = db.query(User).filter(User.id == reserva.user_id).first()
        if user and user.email:
            subject = "⏰ Recordatorio de Reserva - Quico Básquet"
            message = f"""
¡Hola {user.nombre}!

Este es un recordatorio de tu reserva:

📅 Fecha: {reserva.fecha}
⏰ Horario: {reserva.hora_inicio.strftime('%H:%M')}
🏀 Deporte: {reserva.deporte}

¡Te esperamos en Quico Básquet!

Saludos,
El equipo de Quico Básquet
            """
            if send_email(user.email, subject, message):
                enviados += 1
    return {"recordatorios_enviados": enviados} 