from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.cancha import CanchaOut, CanchaCreate, CanchaPreciosUpdate
from app.crud.cancha import get_canchas, get_cancha, update_cancha, update_cancha_precios, get_precio_deporte, get_descuento_deporte, get_descuento_suscripcion, calcular_precio_final
from app.data.database import get_db
from app.services.auth_service import require_admin
from typing import List

router = APIRouter(prefix="/canchas", tags=["Canchas"])

@router.get("/", response_model=List[CanchaOut])
def listar_canchas(db: Session = Depends(get_db)):
    return get_canchas(db)

@router.get("/{cancha_id}", response_model=CanchaOut)
def obtener_cancha(cancha_id: int, db: Session = Depends(get_db)):
    cancha = get_cancha(db, cancha_id)
    if not cancha:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
    return cancha

@router.put("/{cancha_id}", response_model=CanchaOut)
def actualizar_cancha(cancha_id: int, cancha_in: CanchaCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    cancha = update_cancha(db, cancha_id, cancha_in)
    if not cancha:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
    return cancha

@router.put("/{cancha_id}/precios", response_model=CanchaOut)
def actualizar_precios_cancha(
    cancha_id: int, 
    precios_data: CanchaPreciosUpdate, 
    db: Session = Depends(get_db), 
    admin=Depends(require_admin)
):
    """Actualizar precios y descuentos de una cancha (solo para administradores)"""
    print(f"🏀 === ENDPOINT ACTUALIZACIÓN PRECIOS ===")
    print(f"📋 Cancha ID: {cancha_id}")
    print(f"📋 Datos recibidos: {precios_data.model_dump()}")
    
    cancha = update_cancha_precios(db, cancha_id, precios_data)
    if not cancha:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
    
    print(f"✅ Cancha actualizada: {cancha.nombre}")
    return cancha

@router.get("/{cancha_id}/precio/{deporte}")
def obtener_precio_deporte(cancha_id: int, deporte: str, db: Session = Depends(get_db)):
    """Obtener precio de un deporte específico en una cancha"""
    precio = get_precio_deporte(db, cancha_id, deporte)
    if precio == 0:
        raise HTTPException(status_code=404, detail="Deporte no encontrado en esta cancha")
    return {"cancha_id": cancha_id, "deporte": deporte, "precio": precio}

@router.get("/{cancha_id}/descuento/{deporte}")
def obtener_descuento_deporte(cancha_id: int, deporte: str, db: Session = Depends(get_db)):
    """Obtener descuento de un deporte específico en una cancha"""
    descuento = get_descuento_deporte(db, cancha_id, deporte)
    return {"cancha_id": cancha_id, "deporte": deporte, "descuento": descuento}

@router.get("/{cancha_id}/descuento-suscripcion/{deporte}")
def obtener_descuento_suscripcion(cancha_id: int, deporte: str, db: Session = Depends(get_db)):
    """Obtener descuento de suscripción para un deporte específico en una cancha"""
    descuento = get_descuento_suscripcion(db, cancha_id, deporte)
    return {"cancha_id": cancha_id, "deporte": deporte, "descuento_suscripcion": descuento}

@router.get("/{cancha_id}/calcular-precio")
def calcular_precio_cancha(
    cancha_id: int, 
    deporte: str, 
    duracion_horas: float, 
    es_suscripcion: bool = False,
    db: Session = Depends(get_db)
):
    """Calcular precio final con descuentos aplicados"""
    precio_final = calcular_precio_final(db, cancha_id, deporte, duracion_horas, es_suscripcion)
    return {
        "cancha_id": cancha_id,
        "deporte": deporte,
        "duracion_horas": duracion_horas,
        "es_suscripcion": es_suscripcion,
        "precio_final": precio_final
    }

@router.get("/{cancha_id}/precios-descuentos")
def obtener_precios_descuentos_cancha(cancha_id: int, db: Session = Depends(get_db)):
    """Obtener todos los precios y descuentos de una cancha específica"""
    from app.services.precio_service import obtener_precios_y_descuentos_cancha
    
    precios_descuentos = obtener_precios_y_descuentos_cancha(db, cancha_id)
    if not precios_descuentos:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
    
    return {
        "cancha_id": cancha_id,
        "precios_descuentos": precios_descuentos
    } 