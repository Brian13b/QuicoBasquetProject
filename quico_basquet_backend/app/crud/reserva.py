from sqlalchemy.orm import Session
from app.models.reserva import Reserva
from app.services.reserva_service import validar_horario_reserva, calcular_duracion_reserva, hay_solapamiento_reserva_suscripcion
from app.config.settings import DURACION_MINIMA_RESERVA, DURACION_MAXIMA_RESERVA
from datetime import datetime, time
from typing import List, Optional

def crear_reserva(db: Session, reserva_in, precio: float, metodo_pago: str) -> Reserva:
    """Crear una nueva reserva"""
    print("🔧 === PROCESANDO CREACIÓN DE RESERVA ===")
    print(f"📋 Datos de entrada: {reserva_in.__dict__}")
    print(f"💰 Precio recibido: {precio}")
    
    # Validar horario
    if not validar_horario_reserva(reserva_in.hora_inicio, reserva_in.hora_fin):
        raise ValueError("El horario seleccionado está fuera del horario de atención (8:00 AM - 12:00 AM). La última reserva posible es a las 23:00. Por favor, elige un horario dentro de este rango.")
    
    # Validar duración
    duracion = calcular_duracion_reserva(reserva_in.hora_inicio, reserva_in.hora_fin)
    if not (DURACION_MINIMA_RESERVA <= duracion <= DURACION_MAXIMA_RESERVA):
        raise ValueError(f"La duración de la reserva debe estar entre {DURACION_MINIMA_RESERVA} y {DURACION_MAXIMA_RESERVA} minutos. La duración seleccionada es de {duracion} minutos.")
    
    # Verificar solapamiento con reservas Y suscripciones
    if hay_solapamiento_reserva_suscripcion(db, reserva_in.cancha_id, reserva_in.fecha, reserva_in.hora_inicio, reserva_in.hora_fin):
        raise ValueError(f"Ya existe una reserva o suscripción para el horario seleccionado ({reserva_in.hora_inicio} - {reserva_in.hora_fin}) en la fecha {reserva_in.fecha}. Por favor, elige otro horario disponible.")
    
    # Validar que el precio no sea negativo
    if precio <= 0:
        raise ValueError(f"El precio calculado ({precio}) no puede ser negativo o cero. Verifica los precios de la cancha.")
    
    print(f"✅ Validaciones pasadas. Creando reserva...")
    
    # Crear la reserva
    db_reserva = Reserva(
        user_id=reserva_in.user_id,
        cancha_id=reserva_in.cancha_id,
        deporte=reserva_in.deporte,
        fecha=reserva_in.fecha,
        hora_inicio=reserva_in.hora_inicio,
        hora_fin=reserva_in.hora_fin,
        precio=precio,
        metodo_pago=metodo_pago,
        estado="confirmada",
        estado_pago="pendiente",
        nombre_cliente=reserva_in.nombre_cliente
    )
    
    db.add(db_reserva)
    db.commit()
    db.refresh(db_reserva)
    
    print(f"✅ Reserva creada exitosamente con ID: {db_reserva.id}")
    return db_reserva

def hay_solapamiento_reserva(db: Session, cancha_id: int, fecha, hora_inicio: time, hora_fin: time, excluir_reserva_id: int = None) -> bool:
    """Verificar si hay solapamiento con reservas existentes"""
    # Usar la función del servicio que verifica reservas Y suscripciones
    from app.services.reserva_service import hay_solapamiento_reserva_suscripcion
    return hay_solapamiento_reserva_suscripcion(db, cancha_id, fecha, hora_inicio, hora_fin, excluir_reserva_id)

def listar_reservas_usuario(db: Session, user_id: int) -> List[Reserva]:
    """Listar reservas de un usuario"""
    return db.query(Reserva).filter(Reserva.user_id == user_id).order_by(Reserva.fecha.desc(), Reserva.hora_inicio.desc()).all()

def listar_reservas_por_cancha_fecha(db: Session, cancha_id: int, fecha: str) -> List[Reserva]:
    """Listar reservas por cancha y fecha"""
    try:
        fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
    except ValueError:
        return []
    
    return db.query(Reserva).filter(
        Reserva.cancha_id == cancha_id,
        Reserva.fecha == fecha_obj,
        Reserva.estado != "cancelada"
    ).order_by(Reserva.hora_inicio).all()

def listar_todas_reservas(db: Session) -> List[Reserva]:
    """Listar todas las reservas (para administradores)"""
    return db.query(Reserva).order_by(Reserva.fecha.desc(), Reserva.hora_inicio.desc()).all()

def listar_reservas_desde_fecha(db: Session, fecha_desde: str) -> List[Reserva]:
    """Listar todas las reservas desde una fecha específica en adelante"""
    try:
        fecha_obj = datetime.strptime(fecha_desde, "%Y-%m-%d").date()
    except ValueError:
        return []
    
    return db.query(Reserva).filter(
        Reserva.fecha >= fecha_obj
    ).order_by(Reserva.fecha.asc(), Reserva.hora_inicio.asc()).all()

def buscar_reservas_por_usuario(db: Session, termino_busqueda: str) -> List[Reserva]:
    """Buscar reservas por nombre del usuario, email o nombre del cliente"""
    from app.models.user import User
    
    # Buscar usuarios que coincidan con el término
    usuarios_encontrados = db.query(User).filter(
        (User.nombre.ilike(f"%{termino_busqueda}%")) |
        (User.email.ilike(f"%{termino_busqueda}%"))
    ).all()
    
    user_ids = [usuario.id for usuario in usuarios_encontrados]
    
    # Buscar reservas por user_ids o nombre_cliente
    query = db.query(Reserva).filter(
        (Reserva.user_id.in_(user_ids)) |
        (Reserva.nombre_cliente.ilike(f"%{termino_busqueda}%"))
    )
    
    return query.order_by(Reserva.fecha.desc(), Reserva.hora_inicio.desc()).all()

def cancelar_reserva(db: Session, reserva_id: int, user_id: int) -> Optional[Reserva]:
    """Cancelar una reserva"""
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id, Reserva.user_id == user_id).first()
    if not reserva:
        raise ValueError("Reserva no encontrada")
    
    reserva.estado = "cancelada"
    db.commit()
    db.refresh(reserva)
    return reserva

def actualizar_estado_reserva(db: Session, reserva_id: int, nuevo_estado: str) -> Reserva:
    """Actualizar estado de una reserva"""
    estados_validos = ["pendiente", "confirmada", "cancelada", "completada"]
    
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise ValueError("Reserva no encontrada")
    
    if nuevo_estado not in estados_validos:
        raise ValueError(f"Estado inválido. Estados válidos: {estados_validos}")
    
    reserva.estado = nuevo_estado
    db.commit()
    db.refresh(reserva)
    return reserva

def actualizar_estado_pago_reserva(db: Session, reserva_id: int, nuevo_estado_pago: str) -> Reserva:
    """Actualizar estado de pago de una reserva"""
    estados_pago_validos = ["pendiente", "pagado", "cancelado"]
    
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise ValueError("Reserva no encontrada")
    
    if nuevo_estado_pago not in estados_pago_validos:
        raise ValueError(f"Estado de pago inválido. Estados válidos: {estados_pago_validos}")
    
    reserva.estado_pago = nuevo_estado_pago
    db.commit()
    db.refresh(reserva)
    return reserva

def actualizar_precio_reserva(db: Session, reserva_id: int, nuevo_precio: float) -> Reserva:
    """Actualizar precio de una reserva"""
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise ValueError("Reserva no encontrada")
    
    if nuevo_precio < 0:
        raise ValueError("El precio no puede ser negativo")
    
    reserva.precio = nuevo_precio
    db.commit()
    db.refresh(reserva)
    return reserva

def reactivar_reserva(db: Session, reserva_id: int) -> Reserva:
    """Reactivar una reserva cancelada (para administradores)"""
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise ValueError("Reserva no encontrada")
    
    if reserva.estado != "cancelada":
        raise ValueError("Solo se pueden reactivar reservas canceladas")
    
    # Verificar que no haya conflictos de horario al reactivar
    if hay_solapamiento_reserva_suscripcion(db, reserva.cancha_id, reserva.fecha, reserva.hora_inicio, reserva.hora_fin, reserva_id):
        raise ValueError("No se puede reactivar la reserva porque hay un conflicto de horario con otra reserva o suscripción")
    
    reserva.estado = "confirmada"
    db.commit()
    db.refresh(reserva)
    return reserva 