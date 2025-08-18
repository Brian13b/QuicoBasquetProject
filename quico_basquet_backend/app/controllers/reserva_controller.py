from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.schemas.reserva import ReservaCreate, ReservaOut, ReservaInternal, MetodoPagoEnum, ReservaCombinadaOut
from app.crud.reserva import crear_reserva, listar_reservas_usuario, cancelar_reserva, listar_reservas_por_cancha_fecha, reactivar_reserva
from app.services.suscripcion_service import obtener_suscripciones_activas_por_fecha
from app.data.database import get_db
from app.services.auth_service import get_current_user
from app.services.pago_service import obtener_info_pago
from app.services.email_service import send_reservation_confirmation_email, send_reservation_cancellation_email
from app.services.precio_service import calcular_precio_reserva
from app.models.user import User
from app.models.cancha import Cancha
from typing import List
from datetime import datetime

router = APIRouter(prefix="/reservas", tags=["Reservas"])

@router.post("/", response_model=ReservaOut)
def crear_reserva_endpoint(reserva_in: ReservaCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        print("🚀 === CREACIÓN DE RESERVA ===")
        print(f"👤 Usuario: {current_user.id} ({current_user.nombre})")
        print(f"📅 Fecha recibida (raw): {reserva_in.fecha}")
        print(f"📅 Tipo de fecha: {type(reserva_in.fecha)}")
        print(f"📅 Fecha como string: {str(reserva_in.fecha)}")
        print(f"📋 Datos completos: {reserva_in.model_dump()}")
        
        if current_user.bloqueado == "bloqueado":
            raise HTTPException(status_code=403, detail="Tu cuenta ha sido bloqueada. No puedes crear reservas.")
        
        cancha = db.query(Cancha).filter(Cancha.id == reserva_in.cancha_id).first()
        if not cancha:
            raise HTTPException(status_code=404, detail="Cancha no encontrada")
        
        if reserva_in.metodo_pago not in MetodoPagoEnum.__members__.values():
            raise HTTPException(status_code=400, detail="Método de pago no válido")
        
        # Validar nombre_cliente solo si el usuario es admin
        if current_user.rol == "admin":
            if not reserva_in.nombre_cliente or len(reserva_in.nombre_cliente.strip()) < 2:
                raise HTTPException(status_code=400, detail="Como administrador, debes especificar el nombre del cliente (mínimo 2 caracteres)")
        else:
            # Para usuarios normales, no permitir nombre_cliente
            if reserva_in.nombre_cliente:
                raise HTTPException(status_code=400, detail="Los usuarios normales no pueden especificar nombre de cliente")
        
        # Calcular duración en minutos usando el servicio
        from app.services.reserva_service import calcular_duracion_reserva
        duracion_minutos = calcular_duracion_reserva(reserva_in.hora_inicio, reserva_in.hora_fin)
        
        print(f"⏱️ Duración calculada: {duracion_minutos} minutos")
        print(f"🏀 Deporte: {reserva_in.deporte}")
        print(f"🏟️ Cancha ID: {reserva_in.cancha_id}")
        print(f"💰 Precios de la cancha:")
        print(f"   - Básquet: ${cancha.precio_basquet}")
        print(f"   - Vóley: ${cancha.precio_voley}")
        
        # Calcular precio usando el servicio de precios
        costo = calcular_precio_reserva(cancha, reserva_in.deporte, duracion_minutos)
        
        print(f"💰 Precio calculado: ${costo}")
        
        # Validar que el precio no sea negativo
        if costo <= 0:
            print(f"❌ Error: Precio calculado es ${costo} (debe ser mayor a 0)")
            raise HTTPException(status_code=400, detail=f"Error en el cálculo del precio. Precio calculado: ${costo}. Verifica los precios de la cancha.")
        
        # Crear objeto interno con el precio calculado
        reserva_data = reserva_in.model_dump()
        reserva_data['precio'] = costo
        reserva_data['user_id'] = current_user.id
        
        print(f"📊 Datos para crear reserva: {reserva_data}")
        
        reserva_internal = ReservaInternal(**reserva_data)
        
        # Crear la reserva
        reserva = crear_reserva(db, reserva_internal, precio=costo, metodo_pago=reserva_in.metodo_pago)
        
        print(f"✅ Reserva creada con ID: {reserva.id}")
        print(f"📅 Fecha guardada en BD: {reserva.fecha}")
        
        # Obtener información de pago
        info_pago = obtener_info_pago(reserva.metodo_pago, reserva.precio)
        
        # Enviar email de confirmación si el usuario tiene email (solo para usuarios normales)
        if current_user.email and current_user.rol != "admin":
            reserva_data_for_email = {
                'fecha': str(reserva.fecha),
                'hora_inicio': str(reserva.hora_inicio),
                'hora_fin': str(reserva.hora_fin),
                'deporte': reserva.deporte,
                'precio': reserva.precio
            }
            send_reservation_confirmation_email(
                current_user.email, 
                current_user.nombre, 
                reserva_data_for_email, 
                info_pago
            )
        
        return {**reserva.__dict__, "info_pago": info_pago}
    except ValueError as e:
        print(f"❌ Error de validación: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/mis", response_model=List[ReservaOut])
def listar_mis_reservas(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reservas = listar_reservas_usuario(db, current_user.id)
    return reservas

@router.get("/cancha/{cancha_id}", response_model=List[ReservaOut])
def listar_reservas_por_cancha_fecha_endpoint(cancha_id: int, date: str, db: Session = Depends(get_db)):
    return listar_reservas_por_cancha_fecha(db, cancha_id, date)

@router.get("/fecha/{fecha}", response_model=List[ReservaOut])
def listar_reservas_por_fecha_endpoint(fecha: str, cancha_id: int, db: Session = Depends(get_db)):
    reservas = listar_reservas_por_cancha_fecha(db, cancha_id, fecha)
    return reservas

@router.get("/all", response_model=List[ReservaCombinadaOut])
def listar_todas_reservas_endpoint(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db),
    fecha: str = Query(None, description="Fecha en formato YYYY-MM-DD. Si no se especifica, se obtienen todas las reservas")
):
    """Obtener todas las reservas y suscripciones del día (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden ver todas las reservas.")
    
    from app.crud.reserva import listar_todas_reservas
    
    try:
        # Obtener todas las canchas primero
        from app.models.cancha import Cancha
        canchas = db.query(Cancha).all()
        
        # Obtener reservas
        if fecha:
            # Si se especifica una fecha, obtener reservas de esa fecha
            reservas = []
            # Obtener reservas de todas las canchas para esa fecha
            for cancha in canchas:
                reservas_cancha = listar_reservas_por_cancha_fecha(db, cancha.id, fecha)
                reservas.extend(reservas_cancha)
        else:
            # Si no se especifica fecha, obtener todas las reservas
            reservas = listar_todas_reservas(db)
        
        # Si se especifica una fecha, también obtener suscripciones activas
        if fecha:
            try:
                fecha_dt = datetime.strptime(fecha, "%Y-%m-%d")
                # Obtener suscripciones de todas las canchas para esa fecha
                suscripciones = []
                for cancha in canchas:
                    suscripciones_cancha = obtener_suscripciones_activas_por_fecha(db, fecha_dt, cancha.id)
                    suscripciones.extend(suscripciones_cancha)
                
                # Convertir suscripciones a formato de reserva para el frontend
                for suscripcion in suscripciones:
                    # Crear un objeto similar a una reserva pero con información de suscripción
                    reserva_suscripcion = {
                        "id": f"suscripcion_{suscripcion.id}",
                        "user_id": suscripcion.user_id,
                        "cancha_id": suscripcion.cancha_id,
                        "deporte": suscripcion.deporte,
                        "fecha": fecha,
                        "hora_inicio": suscripcion.hora_inicio,
                        "hora_fin": suscripcion.hora_fin,
                        "precio": suscripcion.precio_mensual,
                        "metodo_pago": suscripcion.metodo_pago,
                        "estado": suscripcion.estado,
                        "estado_pago": suscripcion.estado_pago,  # Usar el estado_pago real de la suscripción
                        "tipo": "suscripcion",  # Marcar como suscripción
                        "dia_semana": suscripcion.dia_semana,
                        "fecha_inicio": suscripcion.fecha_inicio,
                        "fecha_fin": suscripcion.fecha_fin,
                        "descuento": suscripcion.descuento
                    }
                    reservas.append(reserva_suscripcion)
                
                print(f"📊 Total reservas: {len([r for r in reservas if not isinstance(r, dict) or r.get('tipo') != 'suscripcion'])}")
                print(f"📅 Total suscripciones: {len([r for r in reservas if isinstance(r, dict) and r.get('tipo') == 'suscripcion'])}")
                
            except ValueError as e:
                print(f"❌ Error al procesar fecha: {e}")
                # Si hay error con la fecha, continuar solo con reservas
        
        return reservas
        
    except Exception as e:
        print(f"❌ Error al obtener reservas y suscripciones: {e}")
        import traceback
        print(f"🔍 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.patch("/{reserva_id}/estado", response_model=ReservaOut)
def actualizar_estado_reserva_endpoint(
    reserva_id: int, 
    estado_data: dict, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Actualizar estado de una reserva (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden actualizar estados.")
    
    from app.crud.reserva import actualizar_estado_reserva
    return actualizar_estado_reserva(db, reserva_id, estado_data.get("estado"))

@router.patch("/{reserva_id}/estado-pago", response_model=ReservaOut)
def actualizar_estado_pago_endpoint(
    reserva_id: int, 
    estado_pago_data: dict, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Actualizar estado de pago de una reserva (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden actualizar estados de pago.")
    
    from app.crud.reserva import actualizar_estado_pago_reserva
    return actualizar_estado_pago_reserva(db, reserva_id, estado_pago_data.get("estado_pago"))

@router.patch("/{reserva_id}/precio", response_model=ReservaOut)
def actualizar_precio_reserva_endpoint(
    reserva_id: int, 
    precio_data: dict, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Actualizar precio de una reserva (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden actualizar precios.")
    
    from app.crud.reserva import actualizar_precio_reserva
    return actualizar_precio_reserva(db, reserva_id, precio_data.get("precio"))

@router.delete("/{reserva_id}", response_model=ReservaOut)
def cancelar_reserva_endpoint(reserva_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reserva = cancelar_reserva(db, reserva_id, current_user.id)
    
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    # Enviar email de cancelación si el usuario tiene email
    user = db.query(User).filter(User.id == reserva.user_id).first()
    if user and user.email:
        reserva_data = {
            'fecha': str(reserva.fecha),
            'hora_inicio': str(reserva.hora_inicio),
            'hora_fin': str(reserva.hora_fin),
            'deporte': reserva.deporte
        }
        send_reservation_cancellation_email(user.email, user.nombre, reserva_data)
    
    return reserva

@router.patch("/{reserva_id}/reactivar", response_model=ReservaOut)
def reactivar_reserva_endpoint(
    reserva_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Reactivar una reserva cancelada (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden reactivar reservas.")
    
    try:
        reserva = reactivar_reserva(db, reserva_id)
        return reserva
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
