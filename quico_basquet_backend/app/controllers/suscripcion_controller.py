from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.schemas.suscripcion import SuscripcionCreate, SuscripcionOut, SuscripcionUpdate, SuscripcionRenovacion
from app.crud.suscripcion import (
    crear_suscripcion, listar_suscripciones_usuario, obtener_suscripcion,
    actualizar_suscripcion, cancelar_suscripcion, listar_todas_suscripciones,
    actualizar_descuento_suscripcion, actualizar_estado_pago_suscripcion, actualizar_estado_suscripcion,
    actualizar_precio_suscripcion, reactivar_suscripcion
)
from app.services.suscripcion_service import renovar_suscripcion, procesar_suscripciones_vencidas, obtener_suscripciones_activas_por_fecha
from app.data.database import get_db
from app.services.email_service import (
    send_subscription_confirmation_email, 
    send_subscription_cancellation_email,
    send_subscription_renewal_email
)
from app.models.user import User
from app.models.suscripcion import Suscripcion
from app.services.auth_service import get_current_user
from typing import List
from datetime import datetime

router = APIRouter(prefix="/suscripciones", tags=["Suscripciones"])

@router.post("/", response_model=SuscripcionOut)
def crear_suscripcion_endpoint(
    suscripcion_in: SuscripcionCreate, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Crear una nueva suscripción"""
    try:
        print("🚀 === CREACIÓN DE SUSCRIPCIÓN ===")
        print(f"👤 Usuario: {current_user.id} ({current_user.nombre})")
        print(f"📋 Datos recibidos: {suscripcion_in.model_dump()}")
        
        # Validar que el user_id coincida con el usuario autenticado
        if suscripcion_in.user_id != current_user.id:
            print(f"❌ Error: user_id no coincide. Enviado: {suscripcion_in.user_id}, Usuario actual: {current_user.id}")
            raise HTTPException(status_code=400, detail="El user_id no coincide con el usuario autenticado")
        
        print("✅ Validación de usuario exitosa")
        
        suscripcion = crear_suscripcion(db, suscripcion_in, current_user.id)
        print(f"✅ Suscripción creada con ID: {suscripcion.id}")
        
        # 🚀 ENVIAR EMAIL EN BACKGROUND (NO BLOQUEA LA RESPUESTA)
        if current_user.email:
            print(f"📧 Programando envío de email en background a: {current_user.email}")
            suscripcion_data = {
                'dia_semana': suscripcion.dia_semana,
                'hora_inicio': str(suscripcion.hora_inicio),
                'hora_fin': str(suscripcion.hora_fin),
                'deporte': suscripcion.deporte,
                'precio_mensual': suscripcion.precio_mensual
            }
            background_tasks.add_task(
                send_subscription_confirmation_email,
                current_user.email,
                current_user.nombre,
                suscripcion_data
            )
        
        print("🎉 Suscripción creada exitosamente (email en background)")
        return suscripcion
    except ValueError as e:
        print(f"❌ Error de validación: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        print(f"📊 Tipo de error: {type(e)}")
        import traceback
        print(f"🔍 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/mis", response_model=List[SuscripcionOut])
def listar_mis_suscripciones(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Listar suscripciones del usuario"""
    return listar_suscripciones_usuario(db, current_user.id)

@router.get("/fecha/{fecha}", response_model=List[SuscripcionOut])
def obtener_suscripciones_por_fecha(
    fecha: str, 
    cancha_id: int = Query(..., description="ID de la cancha"),
    db: Session = Depends(get_db)
):
    """Obtener suscripciones activas para una fecha específica"""
    try:
        # Convertir fecha string a datetime
        fecha_dt = datetime.strptime(fecha, "%Y-%m-%d")
        
        # Obtener suscripciones activas para esa fecha
        suscripciones = obtener_suscripciones_activas_por_fecha(db, fecha_dt, cancha_id)
        
        print(f"📅 Suscripciones encontradas para {fecha} en cancha {cancha_id}: {len(suscripciones)}")
        
        return suscripciones
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Formato de fecha inválido: {fecha}. Use formato YYYY-MM-DD")
    except Exception as e:
        print(f"❌ Error al obtener suscripciones por fecha: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/{suscripcion_id}", response_model=SuscripcionOut)
def obtener_suscripcion_endpoint(suscripcion_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtener una suscripción específica"""
    suscripcion = obtener_suscripcion(db, suscripcion_id, current_user.id)
    if not suscripcion:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    return suscripcion

@router.put("/{suscripcion_id}", response_model=SuscripcionOut)
def actualizar_suscripcion_endpoint(
    suscripcion_id: int, 
    suscripcion_update: SuscripcionUpdate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar una suscripción"""
    suscripcion = actualizar_suscripcion(db, suscripcion_id, current_user.id, suscripcion_update)
    if not suscripcion:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    return suscripcion

@router.delete("/{suscripcion_id}", response_model=SuscripcionOut)
def cancelar_suscripcion_endpoint(suscripcion_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Cancelar una suscripción"""
    suscripcion = cancelar_suscripcion(db, suscripcion_id, current_user.id)
    
    # Enviar email de cancelación si el usuario tiene email
    if current_user.email:
        suscripcion_data = {
            'dia_semana': suscripcion.dia_semana,
            'hora_inicio': str(suscripcion.hora_inicio),
            'hora_fin': str(suscripcion.hora_fin),
            'deporte': suscripcion.deporte
        }
        send_subscription_cancellation_email(
            current_user.email,
            current_user.nombre,
            suscripcion_data
        )
    
    return suscripcion

@router.post("/{suscripcion_id}/renovar", response_model=SuscripcionOut)
def renovar_suscripcion_endpoint(
    suscripcion_id: int, 
    renovacion: SuscripcionRenovacion, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Renovar una suscripción vencida"""
    try:
        suscripcion = renovar_suscripcion(db, suscripcion_id, renovacion.nueva_fecha_fin)
        
        # Enviar email de renovación si el usuario tiene email
        if current_user.email:
            suscripcion_data = {
                'dia_semana': suscripcion.dia_semana,
                'hora_inicio': str(suscripcion.hora_inicio),
                'hora_fin': str(suscripcion.hora_fin),
                'deporte': suscripcion.deporte,
                'precio_mensual': suscripcion.precio_mensual
            }
            send_subscription_renewal_email(
                current_user.email,
                current_user.nombre,
                suscripcion_data,
                renovacion.nueva_fecha_fin
            )
        
        return suscripcion
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Endpoints para administradores
@router.get("/admin/todas", response_model=List[SuscripcionOut])
def listar_todas_suscripciones_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Listar todas las suscripciones (solo admin)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden ver todas las suscripciones.")
    
    return listar_todas_suscripciones(db)

@router.post("/admin/verificar-vencimientos")
def verificar_vencimientos_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Verificar y marcar suscripciones vencidas (solo admin)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden verificar vencimientos.")
    
    suscripciones_vencidas = procesar_suscripciones_vencidas(db)
    return {
        "message": f"Se verificaron {len(suscripciones_vencidas)} suscripciones vencidas",
        "suscripciones_vencidas": len(suscripciones_vencidas)
    }

@router.patch("/{suscripcion_id}/descuento", response_model=SuscripcionOut)
def actualizar_descuento_suscripcion_endpoint(
    suscripcion_id: int, 
    descuento_data: dict, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Actualizar descuento de una suscripción (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden actualizar descuentos.")
    
    return actualizar_descuento_suscripcion(db, suscripcion_id, descuento_data.get("descuento"))

@router.patch("/{suscripcion_id}/estado-pago", response_model=SuscripcionOut)
def actualizar_estado_pago_suscripcion_endpoint(
    suscripcion_id: int, 
    estado_pago_data: dict, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Actualizar estado de pago de una suscripción (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden actualizar estados de pago.")
    
    return actualizar_estado_pago_suscripcion(db, suscripcion_id, estado_pago_data.get("estado_pago"))

@router.patch("/{suscripcion_id}/estado", response_model=SuscripcionOut)
def actualizar_estado_suscripcion_endpoint(
    suscripcion_id: int, 
    estado_data: dict, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Actualizar estado de una suscripción (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden actualizar estados de suscripción.")
    
    return actualizar_estado_suscripcion(db, suscripcion_id, estado_data.get("estado"))

@router.patch("/{suscripcion_id}/precio", response_model=SuscripcionOut)
def actualizar_precio_suscripcion_endpoint(
    suscripcion_id: int, 
    precio_data: dict, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Actualizar precio de una suscripción (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden actualizar precios de suscripción.")
    
    try:
        nuevo_precio = precio_data.get("precio")
        if nuevo_precio is None:
            raise HTTPException(status_code=400, detail="El precio es requerido")
        
        suscripcion = actualizar_precio_suscripcion(db, suscripcion_id, nuevo_precio)
        return suscripcion
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{suscripcion_id}/reactivar", response_model=SuscripcionOut)
def reactivar_suscripcion_endpoint(
    suscripcion_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Reactivar una suscripción cancelada (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden reactivar suscripciones.")
    
    try:
        suscripcion = reactivar_suscripcion(db, suscripcion_id)
        return suscripcion
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) 