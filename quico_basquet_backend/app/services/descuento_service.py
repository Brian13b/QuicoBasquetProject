from sqlalchemy.orm import Session
from app.models.suscripcion import Suscripcion
from typing import Set

def contar_dias_unicos_usuario(db: Session, user_id: int, excluir_suscripcion_id: int = None) -> int:
    """
    Cuenta cuántos días únicos de la semana tiene un usuario con suscripciones activas
    
    Args:
        db: Sesión de base de datos
        user_id: ID del usuario
        excluir_suscripcion_id: ID de suscripción a excluir del conteo (para updates)
    
    Returns:
        Número de días únicos (0-7)
    """
    query = db.query(Suscripcion).filter(
        Suscripcion.user_id == user_id,
        Suscripcion.estado == "activa"
    )
    
    # Excluir suscripción específica si se proporciona
    if excluir_suscripcion_id:
        query = query.filter(Suscripcion.id != excluir_suscripcion_id)
    
    suscripciones_activas = query.all()
    
    # Extraer días únicos
    dias_unicos: Set[int] = set()
    for suscripcion in suscripciones_activas:
        dias_unicos.add(suscripcion.dia_semana)
    
    return len(dias_unicos)

def calcular_descuento_por_dias(cantidad_dias: int) -> float:
    """
    Calcula el descuento automático basado en la cantidad de días únicos
    
    Args:
        cantidad_dias: Número de días únicos de la semana
    
    Returns:
        Porcentaje de descuento (0.0 - 15.0)
    """
    if cantidad_dias >= 3:
        return 15.0  # 15% para 3 o más días
    elif cantidad_dias == 2:
        return 10.0  # 10% para 2 días
    else:
        return 0.0   # Sin descuento para 1 día

def aplicar_descuento_multiple_dias(db: Session, user_id: int, nueva_suscripcion_dia: int = None) -> None:
    """
    Aplica descuentos automáticos a TODAS las suscripciones activas de un usuario
    basado en la cantidad de días únicos
    
    Args:
        db: Sesión de base de datos
        user_id: ID del usuario
        nueva_suscripcion_dia: Día de nueva suscripción a incluir en el conteo
    """
    print(f"🔢 Calculando descuentos automáticos para usuario {user_id}")
    
    # Obtener todas las suscripciones activas del usuario
    suscripciones_activas = db.query(Suscripcion).filter(
        Suscripcion.user_id == user_id,
        Suscripcion.estado == "activa"
    ).all()
    
    # Contar días únicos (incluyendo nueva suscripción si se proporciona)
    dias_unicos: Set[int] = set()
    for suscripcion in suscripciones_activas:
        dias_unicos.add(suscripcion.dia_semana)
    
    # Agregar día de nueva suscripción
    if nueva_suscripcion_dia is not None:
        dias_unicos.add(nueva_suscripcion_dia)
    
    cantidad_dias = len(dias_unicos)
    descuento_automatico = calcular_descuento_por_dias(cantidad_dias)
    
    print(f"📊 Días únicos: {cantidad_dias}, Descuento automático: {descuento_automatico}%")
    
    # Aplicar descuento a TODAS las suscripciones del usuario
    for suscripcion in suscripciones_activas:
        suscripcion.descuento = descuento_automatico
        print(f"   💰 Suscripción {suscripcion.id}: descuento actualizado a {descuento_automatico}%")
    
    # Commit changes
    db.commit()
    
    print(f"✅ Descuentos aplicados a {len(suscripciones_activas)} suscripciones")

def recalcular_precio_con_descuento(suscripcion: Suscripcion, precio_base: float) -> float:
    """
    Recalcula el precio de una suscripción aplicando el descuento
    
    Args:
        suscripcion: Objeto de suscripción
        precio_base: Precio base sin descuento
    
    Returns:
        Precio final con descuento aplicado
    """
    if suscripcion.descuento > 0:
        precio_con_descuento = precio_base * (1 - suscripcion.descuento / 100)
        print(f"💰 Precio recalculado: ${precio_base} - {suscripcion.descuento}% = ${precio_con_descuento}")
        return round(precio_con_descuento, 2)
    
    return precio_base