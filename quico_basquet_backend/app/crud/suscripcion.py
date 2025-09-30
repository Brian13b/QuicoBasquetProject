from sqlalchemy.orm import Session
from app.models.suscripcion import Suscripcion
from app.schemas.suscripcion import SuscripcionCreate, SuscripcionUpdate
from app.services.reserva_service import hay_solapamiento_suscripcion, validar_horario_reserva, hay_solapamiento_reserva_suscripcion, verificar_solapamiento_suscripcion_multiple_dias
from app.services.optimized_reserva_service import verificar_solapamiento_suscripcion_optimizado
from app.services.precio_service import calcular_precio_suscripcion_mensual
from app.config.settings import DURACION_MINIMA_RESERVA, DURACION_MAXIMA_RESERVA
from datetime import datetime, time
from typing import List, Optional

def crear_suscripcion(db: Session, suscripcion_in: SuscripcionCreate, user_id: int) -> Suscripcion:
    """Crear una nueva suscripción"""

    
    # Validar horario
    print(f"⏰ Validando horario: {suscripcion_in.hora_inicio} - {suscripcion_in.hora_fin}")
    if not validar_horario_reserva(suscripcion_in.hora_inicio, suscripcion_in.hora_fin):
        raise ValueError("El horario seleccionado está fuera del horario de atención (8:00 AM - 12:00 AM). Por favor, elige un horario dentro de este rango.")
    print("✅ Horario válido")
    
    # Verificar solapamiento con reservas Y suscripciones para todos los días del período
    if verificar_solapamiento_suscripcion_optimizado(db, suscripcion_in.cancha_id, suscripcion_in.dia_semana, suscripcion_in.hora_inicio, suscripcion_in.hora_fin, suscripcion_in.fecha_inicio, suscripcion_in.fecha_fin):
        dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        dia_nombre = dias_semana[suscripcion_in.dia_semana] if 0 <= suscripcion_in.dia_semana < 7 else f"día {suscripcion_in.dia_semana}"
        raise ValueError(f"Ya existe una reserva o suscripción para el horario {suscripcion_in.hora_inicio} - {suscripcion_in.hora_fin} los {dia_nombre} en el período seleccionado. Por favor, elige otro horario, día de la semana o período.")
    print("✅ No hay solapamiento")
    
    # Calcular duración en horas
    duracion_minutos = int((suscripcion_in.hora_fin.hour - suscripcion_in.hora_inicio.hour) * 60 + 
                          (suscripcion_in.hora_fin.minute - suscripcion_in.hora_inicio.minute))
    duracion_horas = duracion_minutos / 60
    
    # Usar el precio que viene del frontend (ya calculado correctamente)
    precio_mensual_calculado = suscripcion_in.precio_mensual
    
    # Crear la suscripción
    print("💾 Creando objeto de suscripción...")
    db_suscripcion = Suscripcion(
        user_id=user_id,
        cancha_id=suscripcion_in.cancha_id,
        deporte=suscripcion_in.deporte,
        dia_semana=suscripcion_in.dia_semana,
        hora_inicio=suscripcion_in.hora_inicio,
        hora_fin=suscripcion_in.hora_fin,
        precio_mensual=precio_mensual_calculado, 
        descuento=0.0, 
        fecha_inicio=suscripcion_in.fecha_inicio,
        fecha_fin=suscripcion_in.fecha_fin,
        metodo_pago=suscripcion_in.metodo_pago,
        estado="activa",
        estado_pago=suscripcion_in.estado_pago or "pendiente"  
    )
    
    print("💾 Guardando en base de datos...")
    db.add(db_suscripcion)
    db.commit()
    db.refresh(db_suscripcion)
    
    print(f"✅ Suscripción creada exitosamente con ID: {db_suscripcion.id}")
    return db_suscripcion

def listar_suscripciones_usuario(db: Session, user_id: int) -> List[Suscripcion]:
    """Listar suscripciones de un usuario"""
    return db.query(Suscripcion).filter(Suscripcion.user_id == user_id).order_by(Suscripcion.fecha_inicio.desc()).all()

def obtener_suscripcion(db: Session, suscripcion_id: int, user_id: int) -> Optional[Suscripcion]:
    """Obtener una suscripción específica"""
    return db.query(Suscripcion).filter(Suscripcion.id == suscripcion_id, Suscripcion.user_id == user_id).first()

def actualizar_suscripcion(db: Session, suscripcion_id: int, user_id: int, suscripcion_update: SuscripcionUpdate) -> Optional[Suscripcion]:
    """Actualizar una suscripción"""
    suscripcion = obtener_suscripcion(db, suscripcion_id, user_id)
    if not suscripcion:
        return None
    
    # Actualizar campos
    update_data = suscripcion_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(suscripcion, field, value)
    
    db.commit()
    db.refresh(suscripcion)
    return suscripcion

def cancelar_suscripcion(db: Session, suscripcion_id: int, user_id: int) -> Suscripcion:
    """Cancelar una suscripción"""
    suscripcion = db.query(Suscripcion).filter(Suscripcion.id == suscripcion_id, Suscripcion.user_id == user_id).first()
    if not suscripcion:
        raise ValueError("Suscripción no encontrada")
    
    suscripcion.estado = "cancelada"
    db.commit()
    db.refresh(suscripcion)
    return suscripcion

def listar_todas_suscripciones(db: Session) -> List[Suscripcion]:
    """Listar todas las suscripciones (para administradores)"""
    return db.query(Suscripcion).order_by(Suscripcion.fecha_inicio.desc()).all()

def obtener_suscripciones_activas(db: Session) -> List[Suscripcion]:
    """Obtener suscripciones activas"""
    return db.query(Suscripcion).filter(Suscripcion.estado == "activa").all()

def obtener_suscripciones_por_cancha(db: Session, cancha_id: int) -> List[Suscripcion]:
    """Obtener suscripciones por cancha"""
    return db.query(Suscripcion).filter(Suscripcion.cancha_id == cancha_id).all()

def obtener_suscripciones_por_estado(db: Session, estado: str) -> List[Suscripcion]:
    """Obtener suscripciones por estado"""
    return db.query(Suscripcion).filter(Suscripcion.estado == estado).all()

# Actualizar descuento de una suscripción (para administradores)
def actualizar_descuento_suscripcion(db: Session, suscripcion_id: int, nuevo_descuento: float) -> Suscripcion:
    """Actualizar descuento de una suscripción"""
    if not (0 <= nuevo_descuento <= 100):
        raise ValueError("El descuento debe estar entre 0 y 100")
    
    suscripcion = db.query(Suscripcion).filter(Suscripcion.id == suscripcion_id).first()
    if not suscripcion:
        raise ValueError("Suscripción no encontrada")
    
    suscripcion.descuento = nuevo_descuento
    db.commit()
    db.refresh(suscripcion)
    return suscripcion

# Actualizar estado de pago de una suscripción (para administradores)
def actualizar_estado_pago_suscripcion(db: Session, suscripcion_id: int, nuevo_estado_pago: str) -> Suscripcion:
    """Actualizar estado de pago de una suscripción"""
    estados_pago_validos = ["pendiente", "aprobado", "rechazado"]
    
    if nuevo_estado_pago not in estados_pago_validos:
        raise ValueError(f"Estado de pago inválido. Debe ser uno de: {estados_pago_validos}")
    
    suscripcion = db.query(Suscripcion).filter(Suscripcion.id == suscripcion_id).first()
    if not suscripcion:
        raise ValueError("Suscripción no encontrada")
    
    suscripcion.estado_pago = nuevo_estado_pago
    db.commit()
    db.refresh(suscripcion)
    return suscripcion

# Actualizar estado de una suscripción (para administradores)
def actualizar_estado_suscripcion(db: Session, suscripcion_id: int, nuevo_estado: str) -> Suscripcion:
    """Actualizar estado de una suscripción"""
    estados_validos = ["activa", "vencida", "cancelada", "pendiente"]
    
    if nuevo_estado not in estados_validos:
        raise ValueError(f"Estado inválido. Debe ser uno de: {estados_validos}")
    
    suscripcion = db.query(Suscripcion).filter(Suscripcion.id == suscripcion_id).first()
    if not suscripcion:
        raise ValueError("Suscripción no encontrada")
    
    suscripcion.estado = nuevo_estado
    db.commit()
    db.refresh(suscripcion)
    return suscripcion

# Actualizar precio de una suscripción (para administradores)
def actualizar_precio_suscripcion(db: Session, suscripcion_id: int, nuevo_precio: float) -> Suscripcion:
    """Actualizar precio mensual de una suscripción"""
    if nuevo_precio <= 0:
        raise ValueError("El precio debe ser un valor positivo")
    
    suscripcion = db.query(Suscripcion).filter(Suscripcion.id == suscripcion_id).first()
    if not suscripcion:
        raise ValueError("Suscripción no encontrada")
    
    suscripcion.precio_mensual = nuevo_precio
    db.commit()
    db.refresh(suscripcion)
    return suscripcion

def reactivar_suscripcion(db: Session, suscripcion_id: int) -> Suscripcion:
    """Reactivar una suscripción cancelada (para administradores)"""
    suscripcion = db.query(Suscripcion).filter(Suscripcion.id == suscripcion_id).first()
    if not suscripcion:
        raise ValueError("Suscripción no encontrada")
    
    if suscripcion.estado != "cancelada":
        raise ValueError("Solo se pueden reactivar suscripciones canceladas")
    
    # Verificar que no haya conflictos de horario al reactivar
    from app.services.reserva_service import verificar_solapamiento_suscripcion_multiple_dias
    if verificar_solapamiento_suscripcion_multiple_dias(db, suscripcion.cancha_id, suscripcion.dia_semana, suscripcion.hora_inicio, suscripcion.hora_fin, suscripcion.fecha_inicio, suscripcion.fecha_fin, suscripcion_id):
        raise ValueError("No se puede reactivar la suscripción porque hay un conflicto de horario con otra reserva o suscripción")
    
    suscripcion.estado = "activa"
    db.commit()
    db.refresh(suscripcion)
    return suscripcion 