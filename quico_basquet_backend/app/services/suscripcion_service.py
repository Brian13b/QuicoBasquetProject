import json
import logging
from datetime import datetime, timedelta, time
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.suscripcion import Suscripcion
from app.models.reserva import Reserva
from app.schemas.suscripcion import SuscripcionCreate, SuscripcionUpdate
from app.services.reserva_service import hay_solapamiento_suscripcion, validar_horario_reserva
from app.config.settings import settings

logger = logging.getLogger(__name__)

def cargar_configuracion_precios() -> Dict[str, float]:
    """Cargar configuración de precios desde archivo JSON"""
    try:
        with open('config/precios.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, AttributeError):
        # Usar precios por defecto si no se puede cargar el archivo
        return {
            "basquet": settings.PRECIO_BASQUET_POR_HORA,
            "volley": settings.PRECIO_VOLLEY_POR_HORA
        }

def calcular_precio_mensual(cancha, deporte: str, horas_por_semana: int = 1) -> float:
    """Calcular precio mensual de una suscripción"""
    try:
        with open('config/precios.json', 'r', encoding='utf-8') as f:
            precios = json.load(f)
    except (json.JSONDecodeError, AttributeError):
        # Usar precios por defecto si no se puede cargar el archivo
        precios = {
            "basquet": settings.PRECIO_BASQUET_POR_HORA,
            "volley": settings.PRECIO_VOLLEY_POR_HORA
        }
    
    # Obtener precio base según el deporte
    precio_base = precios.get(deporte.lower(), settings.PRECIO_BASQUET_POR_HORA)
    
    # Calcular precio mensual (4 semanas por mes)
    precio_mensual = precio_base * horas_por_semana * 4
    
    # Aplicar descuento de suscripción
    descuento = settings.DESCUENTO_SUSCRIPCION / 100
    precio_con_descuento = precio_mensual * (1 - descuento)
    
    return round(precio_con_descuento, 2)

def generar_fechas_mensuales(fecha_inicio: datetime, meses: int = 1) -> List[datetime]:
    """
    Genera las fechas de las sesiones para un período mensual.
    """
    fechas = []
    fecha_actual = fecha_inicio
    
    for _ in range(meses * 4):  # 4 semanas por mes
        fechas.append(fecha_actual)
        fecha_actual += timedelta(weeks=1)
    
    return fechas

def crear_reservas_desde_suscripcion(db, suscripcion: Suscripcion, fecha_fin: datetime) -> List[Reserva]:
    """Crear reservas automáticas desde una suscripción"""
    reservas = []
    fecha_actual = suscripcion.fecha_inicio
    
    while fecha_actual <= fecha_fin:
        # Verificar si el día de la semana coincide
        if fecha_actual.weekday() == suscripcion.dia_semana:
            # Verificar si no hay solapamiento
            if not hay_solapamiento_suscripcion(
                db, 
                suscripcion.cancha_id, 
                suscripcion.dia_semana, 
                suscripcion.hora_inicio, 
                suscripcion.hora_fin
            ):
                # Crear reserva
                reserva = Reserva(
                    user_id=suscripcion.user_id,
                    cancha_id=suscripcion.cancha_id,
                    deporte="basquet",  # Por defecto
                    fecha=fecha_actual.date(),
                    hora_inicio=suscripcion.hora_inicio,
                    hora_fin=suscripcion.hora_fin,
                    precio=suscripcion.precio_mensual / 4,  # Precio por semana
                    metodo_pago="efectivo",
                    estado="confirmada",
                    estado_pago=suscripcion.estado_pago  # Usar el estado_pago de la suscripción
                )
                reservas.append(reserva)
        
        fecha_actual += timedelta(days=1)
    
    return reservas

def procesar_suscripciones_vencidas(db) -> List[Suscripcion]:
    """Procesar suscripciones que han vencido"""
    hoy = datetime.now().date()
    suscripciones_vencidas = db.query(Suscripcion).filter(
        Suscripcion.estado == "activa",
        Suscripcion.fecha_fin < hoy
    ).all()
    
    for suscripcion in suscripciones_vencidas:
        suscripcion.estado = "vencida"
    
    db.commit()
    return suscripciones_vencidas

def renovar_suscripcion(db, suscripcion_id: int, nueva_fecha_fin: datetime) -> Suscripcion:
    """Renovar una suscripción"""
    suscripcion = db.query(Suscripcion).filter(Suscripcion.id == suscripcion_id).first()
    if not suscripcion:
        raise ValueError("Suscripción no encontrada")
    
    suscripcion.fecha_fin = nueva_fecha_fin
    suscripcion.estado = "activa"
    
    db.commit()
    db.refresh(suscripcion)
    return suscripcion

def obtener_suscripciones_activas_por_fecha(db: Session, fecha: datetime, cancha_id: int) -> List[Suscripcion]:
    """
    Obtiene las suscripciones activas para una fecha específica.
    """
    dia_semana = fecha.weekday()
    query = db.query(Suscripcion).filter(
        Suscripcion.cancha_id == cancha_id,
        Suscripcion.dia_semana == dia_semana,
        Suscripcion.estado == "activa",
        Suscripcion.fecha_inicio <= fecha,
        Suscripcion.fecha_fin >= fecha
    )
    return query.all()

def calcular_disponibilidad_con_suscripciones(db: Session, cancha_id: int, fecha: datetime, hora_inicio: time, hora_fin: time) -> bool:
    """
    Verifica si un horario está disponible considerando suscripciones activas.
    """
    # Obtener suscripciones activas para esa fecha y cancha
    suscripciones_activas = obtener_suscripciones_activas_por_fecha(db, fecha, cancha_id)
    
    # Verificar si hay solapamiento con alguna suscripción
    for suscripcion in suscripciones_activas:
        if not (hora_fin <= suscripcion.hora_inicio or hora_inicio >= suscripcion.hora_fin):
            return False  # No disponible, hay una suscripción activa
    
    return True  # Disponible 