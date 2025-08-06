from sqlalchemy.orm import Session
from app.models.cancha import Cancha
from app.schemas.cancha import CanchaCreate, CanchaUpdate, CanchaPreciosUpdate
from typing import Optional

# Obtener todas las canchas
def get_canchas(db: Session):
    return db.query(Cancha).all()

# Obtener cancha por id
def get_cancha(db: Session, cancha_id: int) -> Optional[Cancha]:
    return db.query(Cancha).filter(Cancha.id == cancha_id).first()

# Actualizar cancha (solo admin)
def update_cancha(db: Session, cancha_id: int, cancha_in: CanchaCreate) -> Optional[Cancha]:
    cancha = db.query(Cancha).filter(Cancha.id == cancha_id).first()
    if not cancha:
        return None
    
    update_data = cancha_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cancha, field, value)
    
    db.commit()
    db.refresh(cancha)
    return cancha

# Actualizar precios y descuentos de una cancha (solo admin)
def update_cancha_precios(db: Session, cancha_id: int, precios_data: CanchaPreciosUpdate) -> Optional[Cancha]:
    print(f"💰 === ACTUALIZACIÓN DE PRECIOS ===")
    print(f"🏀 Cancha ID: {cancha_id}")
    print(f"📋 Datos recibidos: {precios_data.model_dump()}")
    
    cancha = db.query(Cancha).filter(Cancha.id == cancha_id).first()
    if not cancha:
        print(f"❌ Cancha no encontrada con ID: {cancha_id}")
        return None
    
    print(f"🏀 Cancha encontrada: {cancha.nombre}")
    print(f"📊 Valores actuales:")
    print(f"   - precio_basquet: {cancha.precio_basquet}")
    print(f"   - precio_voley: {cancha.precio_voley}")
    print(f"   - descuento_basquet: {cancha.descuento_basquet}")
    print(f"   - descuento_voley: {cancha.descuento_voley}")
    print(f"   - descuento_suscripcion: {cancha.descuento_suscripcion}")
    
    # Actualizar campos directamente
    cancha.precio_basquet = precios_data.precio_basquet
    cancha.precio_voley = precios_data.precio_voley
    cancha.descuento_basquet = precios_data.descuento_basquet
    cancha.descuento_voley = precios_data.descuento_voley
    cancha.descuento_suscripcion = precios_data.descuento_suscripcion
    
    print(f"📊 Valores después de actualizar:")
    print(f"   - precio_basquet: {cancha.precio_basquet}")
    print(f"   - precio_voley: {cancha.precio_voley}")
    print(f"   - descuento_basquet: {cancha.descuento_basquet}")
    print(f"   - descuento_voley: {cancha.descuento_voley}")
    print(f"   - descuento_suscripcion: {cancha.descuento_suscripcion}")
    
    db.commit()
    db.refresh(cancha)
    
    print(f"✅ Precios actualizados exitosamente")
    return cancha

# Obtener precio de un deporte específico
def get_precio_deporte(db: Session, cancha_id: int, deporte: str) -> float:
    cancha = get_cancha(db, cancha_id)
    if not cancha:
        return 0
    
    if deporte == "basquet":
        return cancha.precio_basquet
    elif deporte == "voley":
        return cancha.precio_voley
    else:
        return 0

# Obtener descuento de un deporte específico
def get_descuento_deporte(db: Session, cancha_id: int, deporte: str) -> float:
    cancha = get_cancha(db, cancha_id)
    if not cancha:
        return 0
    
    if deporte == "basquet":
        return cancha.descuento_basquet
    elif deporte == "voley":
        return cancha.descuento_voley
    else:
        return 0

# Obtener descuento de suscripción
def get_descuento_suscripcion(db: Session, cancha_id: int, deporte: str) -> float:
    cancha = get_cancha(db, cancha_id)
    if not cancha:
        return 0
    
    # Usar el mismo descuento de suscripción para todos los deportes
    return cancha.descuento_suscripcion

# Calcular precio final con descuentos
def calcular_precio_final(db: Session, cancha_id: int, deporte: str, duracion_horas: float, es_suscripcion: bool = False) -> float:
    precio_base = get_precio_deporte(db, cancha_id, deporte)
    if precio_base == 0:
        return 0
    
    descuento_deporte = get_descuento_deporte(db, cancha_id, deporte)
    descuento_suscripcion = get_descuento_suscripcion(db, cancha_id, deporte) if es_suscripcion else 0
    
    # Aplicar descuentos
    precio_con_descuento_deporte = precio_base * (1 - descuento_deporte / 100)
    precio_final = precio_con_descuento_deporte * (1 - descuento_suscripcion / 100)
    
    return precio_final * duracion_horas 