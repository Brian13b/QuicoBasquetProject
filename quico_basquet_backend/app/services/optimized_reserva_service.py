from datetime import time, datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List

def verificar_solapamiento_suscripcion_optimizado(
    db: Session, 
    cancha_id: int, 
    dia_semana: int, 
    hora_inicio: time, 
    hora_fin: time, 
    fecha_inicio: date, 
    fecha_fin: date, 
    excluir_suscripcion_id: int = None
) -> bool:
    """
    Versión optimizada que usa una sola query para verificar solapamientos
    en lugar de hacer múltiples queries secuenciales
    """
    from app.models.reserva import Reserva
    from app.models.suscripcion import Suscripcion
    
    print(f"🚀 Verificación optimizada de solapamiento:")
    print(f"   - Cancha: {cancha_id}")
    print(f"   - Día de semana: {dia_semana}")
    print(f"   - Horario: {hora_inicio} - {hora_fin}")
    print(f"   - Período: {fecha_inicio} a {fecha_fin}")
    
    # 1. Generar todas las fechas que coincidan con el día de la semana
    fechas_objetivo = []
    fecha_actual = fecha_inicio
    
    while fecha_actual <= fecha_fin:
        if fecha_actual.weekday() == dia_semana:
            fechas_objetivo.append(fecha_actual)
        fecha_actual += timedelta(days=1)
    
    if not fechas_objetivo:
        print("   ✅ No hay fechas que verificar")
        return False
    
    print(f"   - Fechas a verificar: {len(fechas_objetivo)}")
    
    # 2. UNA SOLA QUERY para todas las reservas en esas fechas
    reservas_conflicto = db.query(Reserva).filter(
        and_(
            Reserva.cancha_id == cancha_id,
            Reserva.fecha.in_(fechas_objetivo),
            Reserva.estado != "cancelada",
            # Verificar solapamiento de horarios
            or_(
                # Caso 1: Horarios idénticos
                and_(
                    Reserva.hora_inicio == hora_inicio,
                    Reserva.hora_fin == hora_fin
                ),
                # Caso 2: Solapamiento parcial
                and_(
                    Reserva.hora_inicio < hora_fin,
                    Reserva.hora_fin > hora_inicio
                )
            )
        )
    ).first()
    
    # 3. UNA SOLA QUERY para suscripciones en conflicto
    suscripciones_conflicto = db.query(Suscripcion).filter(
        and_(
            Suscripcion.cancha_id == cancha_id,
            Suscripcion.dia_semana == dia_semana,
            Suscripcion.estado == "activa",
            # Verificar solapamiento de horarios
            or_(
                # Caso 1: Horarios idénticos
                and_(
                    Suscripcion.hora_inicio == hora_inicio,
                    Suscripcion.hora_fin == hora_fin
                ),
                # Caso 2: Solapamiento parcial
                and_(
                    Suscripcion.hora_inicio < hora_fin,
                    Suscripcion.hora_fin > hora_inicio
                )
            )
        )
    )
    
    if excluir_suscripcion_id:
        suscripciones_conflicto = suscripciones_conflicto.filter(
            Suscripcion.id != excluir_suscripcion_id
        )
    
    suscripcion_conflicto = suscripciones_conflicto.first()
    
    hay_conflicto = reservas_conflicto is not None or suscripcion_conflicto is not None
    
    print(f"   - Reservas en conflicto: {'Sí' if reservas_conflicto else 'No'}")
    print(f"   - Suscripciones en conflicto: {'Sí' if suscripcion_conflicto else 'No'}")
    print(f"   - Resultado: {'❌ HAY CONFLICTO' if hay_conflicto else '✅ NO HAY CONFLICTO'}")
    
    return hay_conflicto


def verificar_solapamiento_bulk_insert(
    db: Session,
    reservas_a_crear: List[dict]
) -> bool:
    """
    Verifica solapamientos para múltiples reservas de una vez
    Útil para suscripciones que crean varias reservas automáticamente
    """
    from app.models.reserva import Reserva
    from app.models.suscripcion import Suscripcion
    
    if not reservas_a_crear:
        return False
    
    print(f"🔍 Verificación bulk para {len(reservas_a_crear)} reservas")
    
    # Extraer todas las fechas y canchas únicas
    fechas_canchas = set()
    for reserva in reservas_a_crear:
        fechas_canchas.add((reserva['fecha'], reserva['cancha_id']))
    
    print(f"   - Combinaciones fecha/cancha únicas: {len(fechas_canchas)}")
    
    # UNA SOLA QUERY para todas las reservas existentes
    fechas = [fc[0] for fc in fechas_canchas]
    canchas = list(set([fc[1] for fc in fechas_canchas]))
    
    reservas_existentes = db.query(Reserva).filter(
        and_(
            Reserva.fecha.in_(fechas),
            Reserva.cancha_id.in_(canchas),
            Reserva.estado != "cancelada"
        )
    ).all()
    
    # UNA SOLA QUERY para todas las suscripciones
    dias_semana = list(set([r['fecha'].weekday() for r in reservas_a_crear]))
    
    suscripciones_existentes = db.query(Suscripcion).filter(
        and_(
            Suscripcion.cancha_id.in_(canchas),
            Suscripcion.dia_semana.in_(dias_semana),
            Suscripcion.estado == "activa"
        )
    ).all()
    
    # Verificar conflictos en memoria (más rápido que N queries)
    for nueva_reserva in reservas_a_crear:
        fecha = nueva_reserva['fecha']
        cancha_id = nueva_reserva['cancha_id']
        hora_inicio = nueva_reserva['hora_inicio']
        hora_fin = nueva_reserva['hora_fin']
        dia_semana = fecha.weekday()
        
        # Verificar contra reservas existentes
        for reserva_existente in reservas_existentes:
            if (reserva_existente.fecha == fecha and 
                reserva_existente.cancha_id == cancha_id and
                hay_solapamiento_horario(hora_inicio, hora_fin, 
                                       reserva_existente.hora_inicio, 
                                       reserva_existente.hora_fin)):
                print(f"   ❌ Conflicto con reserva existente en {fecha}")
                return True
        
        # Verificar contra suscripciones existentes
        for suscripcion in suscripciones_existentes:
            if (suscripcion.cancha_id == cancha_id and 
                suscripcion.dia_semana == dia_semana and
                hay_solapamiento_horario(hora_inicio, hora_fin, 
                                       suscripcion.hora_inicio, 
                                       suscripcion.hora_fin)):
                print(f"   ❌ Conflicto con suscripción en {fecha}")
                return True
    
    print(f"   ✅ No hay conflictos")
    return False


def hay_solapamiento_horario(hora1_inicio: time, hora1_fin: time, 
                           hora2_inicio: time, hora2_fin: time) -> bool:
    """
    Verifica si dos rangos de horario se solapan
    """
    return not (hora1_fin <= hora2_inicio or hora1_inicio >= hora2_fin)


def crear_reservas_bulk(db: Session, reservas_data: List[dict]) -> List:
    """
    Crea múltiples reservas en una sola transacción
    """
    from app.models.reserva import Reserva
    
    print(f"💾 Creando {len(reservas_data)} reservas en bulk")
    
    reservas_objetos = []
    for data in reservas_data:
        reserva = Reserva(**data)
        reservas_objetos.append(reserva)
    
    try:
        # UNA SOLA TRANSACCIÓN para todas las reservas
        db.add_all(reservas_objetos)
        db.commit()
        
        # Refresh all objects
        for reserva in reservas_objetos:
            db.refresh(reserva)
        
        print(f"✅ {len(reservas_objetos)} reservas creadas exitosamente")
        return reservas_objetos
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error en bulk insert: {e}")
        raise