import json
from typing import Dict, Optional
from sqlalchemy.orm import Session
from app.models.cancha import Cancha

def obtener_precio_por_deporte(cancha, deporte: str) -> float:
    """
    Obtiene el precio por hora para un deporte específico en una cancha.
    """
    if deporte == "basquet":
        return cancha.precio_basquet
    elif deporte == "voley":
        return cancha.precio_voley
    else:
        return 0

def obtener_todos_precios_deportes(cancha) -> Dict[str, float]:
    """
    Obtiene todos los precios por deporte para una cancha.
    """
    return {
        "basquet": cancha.precio_basquet,
        "voley": cancha.precio_voley
    }

def calcular_precio_reserva(cancha, deporte: str, duracion_minutos: int) -> float:
    """
    Calcula el precio total de una reserva basado en el deporte y duración.
    """
    precio_por_hora = obtener_precio_por_deporte(cancha, deporte)
    if precio_por_hora == 0:
        return 0
    
    horas = duracion_minutos / 60
    return round(precio_por_hora * horas, 2)

def obtener_descuento_deporte(cancha, deporte: str) -> float:
    """
    Obtiene el descuento para un deporte específico en una cancha.
    """
    if deporte == "basquet":
        return cancha.descuento_basquet
    elif deporte == "voley":
        return cancha.descuento_voley
    else:
        return 0

def obtener_descuento_suscripcion(cancha, deporte: str) -> float:
    """
    Obtiene el descuento de suscripción para un deporte específico en una cancha.
    """
    return cancha.descuento_suscripcion

def calcular_precio_final(cancha, deporte: str, duracion_horas: float, es_suscripcion: bool = False) -> float:
    """
    Calcula el precio final con descuentos aplicados.
    """
    precio_base = obtener_precio_por_deporte(cancha, deporte)
    if precio_base == 0:
        return 0
    
    descuento_deporte = obtener_descuento_deporte(cancha, deporte)
    descuento_suscripcion = obtener_descuento_suscripcion(cancha, deporte) if es_suscripcion else 0
    
    # Aplicar descuentos
    precio_con_descuento_deporte = precio_base * (1 - descuento_deporte / 100)
    precio_final = precio_con_descuento_deporte * (1 - descuento_suscripcion / 100)
    
    return round(precio_final * duracion_horas, 2)

# NUEVAS FUNCIONES PARA SUSCRIPCIONES
def calcular_precio_suscripcion_mensual(db: Session, cancha_id: int, deporte: str, duracion_horas: float, sesiones_por_mes: int = 4.33) -> float:
    """
    Calcula el precio mensual de una suscripción usando datos de la base de datos.
    
    Args:
        db: Sesión de base de datos
        cancha_id: ID de la cancha
        deporte: Deporte (basquet/voley)
        duracion_horas: Duración por sesión en horas
        sesiones_por_mes: Número de sesiones por mes (default: 4.33)
    
    Returns:
        Precio mensual calculado con descuentos aplicados
    """
    cancha = db.query(Cancha).filter(Cancha.id == cancha_id).first()
    if not cancha:
        return 0
    
    # Calcular precio por sesión con descuento de suscripción
    precio_por_sesion = calcular_precio_final(cancha, deporte, duracion_horas, es_suscripcion=True)
    
    # Calcular precio mensual total
    precio_mensual = precio_por_sesion * sesiones_por_mes
    
    return round(precio_mensual, 2)

def calcular_precio_suscripcion_por_sesion(db: Session, cancha_id: int, deporte: str, duracion_horas: float) -> float:
    """
    Calcula el precio por sesión de una suscripción usando datos de la base de datos.
    
    Args:
        db: Sesión de base de datos
        cancha_id: ID de la cancha
        deporte: Deporte (basquet/voley)
        duracion_horas: Duración por sesión en horas
    
    Returns:
        Precio por sesión con descuento de suscripción aplicado
    """
    cancha = db.query(Cancha).filter(Cancha.id == cancha_id).first()
    if not cancha:
        return 0
    
    return calcular_precio_final(cancha, deporte, duracion_horas, es_suscripcion=True)

def obtener_precios_y_descuentos_cancha(db: Session, cancha_id: int) -> Dict:
    """
    Obtiene todos los precios y descuentos de una cancha desde la base de datos.
    
    Args:
        db: Sesión de base de datos
        cancha_id: ID de la cancha
    
    Returns:
        Diccionario con precios y descuentos
    """
    cancha = db.query(Cancha).filter(Cancha.id == cancha_id).first()
    if not cancha:
        return {}
    
    return {
        "precio_basquet": cancha.precio_basquet,
        "precio_voley": cancha.precio_voley,
        "descuento_basquet": cancha.descuento_basquet,
        "descuento_voley": cancha.descuento_voley,
        "descuento_suscripcion": cancha.descuento_suscripcion
    } 