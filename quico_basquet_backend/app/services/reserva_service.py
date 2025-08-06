from datetime import time, datetime, date
from typing import Tuple
from app.config.settings import settings

# Horarios de atención
HORARIO_APERTURA_TIME = time(8, 0)  # 08:00
HORARIO_CIERRE_TIME = time(0, 0)    # 00:00 (medianoche)

# Duración de reservas
DURACION_MINIMA_MINUTOS = 60
DURACION_MAXIMA_MINUTOS = 120  # 2 horas

def validar_horario_reserva(hora_inicio: time, hora_fin: time) -> bool:
    """
    Valida que el horario de reserva esté dentro del horario de atención
    Horario de atención: 8:00 AM - 12:00 AM (medianoche)
    Última reserva posible: 23:00 (para terminar a las 00:00)
    """
    print(f"🔍 Validando horario: {hora_inicio} - {hora_fin}")
    print(f"📅 Horario de atención: {HORARIO_APERTURA_TIME} - {HORARIO_CIERRE_TIME}")
    
    # Validar que la hora de inicio esté dentro del horario de atención
    if hora_inicio < HORARIO_APERTURA_TIME:
        print(f"❌ Hora de inicio {hora_inicio} es antes del horario de apertura {HORARIO_APERTURA_TIME}")
        return False
    
    # Validar que la hora de fin esté dentro del horario de atención
    # Solo rechazar si la hora de fin está después de medianoche (00:01 - 07:59)
    # time(0, 0) = medianoche (válido), time(0, 1) hasta time(7, 59) = después de medianoche (inválido)
    if hora_fin > time(0, 0) and hora_fin < HORARIO_APERTURA_TIME:
        print(f"❌ Hora de fin {hora_fin} está después de medianoche y antes del horario de apertura")
        return False
    
    # Validar que la hora de inicio sea menor que la hora de fin
    # Excepción: cuando cruza medianoche (ej: 23:00-00:00)
    if hora_inicio >= hora_fin and hora_fin != time(0, 0):
        print(f"❌ Hora de inicio {hora_inicio} debe ser menor que hora de fin {hora_fin}")
        return False
    
    # Validar que la última reserva posible sea a las 23:00 (para terminar a las 00:00)
    if hora_inicio >= time(23, 0) and hora_fin > time(0, 0):
        print(f"❌ No se pueden hacer reservas después de las 23:00 (última reserva: 23:00-00:00)")
        return False
    
    print(f"✅ Horario válido: {hora_inicio} - {hora_fin}")
    return True

def calcular_duracion_reserva(hora_inicio: time, hora_fin: time) -> int:
    """
    Calcula la duración de una reserva en minutos
    Maneja correctamente el caso cuando la hora de fin cruza la medianoche
    """
    inicio_minutos = hora_inicio.hour * 60 + hora_inicio.minute
    fin_minutos = hora_fin.hour * 60 + hora_fin.minute
    
    print(f"⏱️ Cálculo de duración:")
    print(f"   - Hora inicio: {hora_inicio} ({inicio_minutos} minutos)")
    print(f"   - Hora fin: {hora_fin} ({fin_minutos} minutos)")
    print(f"   - Comparación: {fin_minutos} < {inicio_minutos} = {fin_minutos < inicio_minutos}")
    
    # Si la hora de fin es menor que la de inicio, cruza medianoche
    if fin_minutos < inicio_minutos:
        print(f"   - Cruza medianoche, ajustando fin_minutos de {fin_minutos} a {fin_minutos + 24 * 60}")
        fin_minutos += 24 * 60  # Agregar 24 horas (1440 minutos)
    else:
        print(f"   - No cruza medianoche")
    
    duracion = fin_minutos - inicio_minutos
    
    print(f"   - Duración final: {duracion} minutos")
    
    return duracion

def validar_solapamiento_reservas(
    hora_inicio_nueva: time, 
    hora_fin_nueva: time,
    reservas_existentes: list
) -> bool:
    """
    Valida que no haya solapamiento con reservas existentes
    Retorna True si NO hay solapamiento, False si HAY solapamiento
    """
    for reserva in reservas_existentes:
        # Verificar si hay solapamiento
        # Dos horarios se solapan si:
        # 1. Horarios idénticos, O
        # 2. hora_fin_nueva > reserva.hora_inicio AND hora_inicio_nueva < reserva.hora_fin
        # 3. Caso especial para medianoche: usar comparación de minutos
        if (hora_inicio_nueva == reserva.hora_inicio and hora_fin_nueva == reserva.hora_fin) or \
           (hora_fin_nueva > reserva.hora_inicio and hora_inicio_nueva < reserva.hora_fin):
            print(f"    ❌ Solapamiento detectado: {hora_inicio_nueva}-{hora_fin_nueva} con {reserva.hora_inicio}-{reserva.hora_fin}")
            return False
        
        # Caso especial: si la reserva existente termina a medianoche (00:00)
        if reserva.hora_fin == time(0, 0):
            # Convertir a minutos para comparación
            inicio_nueva_min = hora_inicio_nueva.hour * 60 + hora_inicio_nueva.minute
            fin_existente_min = 24 * 60  # 00:00 = 24:00 = 1440 minutos
            
            if hora_inicio_nueva < time(0, 0):  # Si la nueva reserva empieza antes de medianoche
                print(f"    ❌ Solapamiento detectado: {hora_inicio_nueva}-{hora_fin_nueva} con {reserva.hora_inicio}-{reserva.hora_fin} (medianoche)")
                return False
    
    print(f"    ✅ No hay solapamiento")
    return True

def hay_solapamiento_solo_reservas(db, cancha_id: int, fecha, hora_inicio: time, hora_fin: time, excluir_reserva_id: int = None) -> bool:
    """
    Verifica SOLO si hay solapamiento con reservas existentes (sin suscripciones)
    """
    from app.models.reserva import Reserva
    
    # Obtener todas las reservas existentes para la fecha y cancha
    reservas_existentes = db.query(Reserva).filter(
        Reserva.cancha_id == cancha_id,
        Reserva.fecha == fecha,
        Reserva.estado != "cancelada"
    ).all()
    
    if excluir_reserva_id:
        reservas_existentes = [r for r in reservas_existentes if r.id != excluir_reserva_id]
    
    # Usar la función validar_solapamiento_reservas que ya funciona correctamente
    hay_solapamiento = not validar_solapamiento_reservas(hora_inicio, hora_fin, reservas_existentes)
    
    print(f"🔍 Solapamiento solo con reservas: {hay_solapamiento}")
    print(f"   - Reservas existentes: {len(reservas_existentes)}")
    for r in reservas_existentes:
        print(f"     * {r.hora_inicio} - {r.hora_fin}")
    
    return hay_solapamiento

# Validar solapamiento de suscripciones para una cancha, día de semana y horario
def hay_solapamiento_suscripcion(db, cancha_id: int, dia_semana: int, hora_inicio: time, hora_fin: time, excluir_suscripcion_id: int = None) -> bool:
    """
    Verifica si hay solapamiento con suscripciones existentes
    """
    from app.models.suscripcion import Suscripcion
    
    # Obtener todas las suscripciones activas para el día de la semana y cancha
    suscripciones_existentes = db.query(Suscripcion).filter(
        Suscripcion.cancha_id == cancha_id,
        Suscripcion.dia_semana == dia_semana,
        Suscripcion.estado == "activa"
    ).all()
    
    if excluir_suscripcion_id:
        suscripciones_existentes = [s for s in suscripciones_existentes if s.id != excluir_suscripcion_id]
    
    # Usar la misma lógica de validación que funciona para reservas
    hay_solapamiento = False
    for suscripcion in suscripciones_existentes:
        # Verificar si hay solapamiento usando la misma lógica
        if (hora_inicio == suscripcion.hora_inicio and hora_fin == suscripcion.hora_fin) or \
           (hora_fin > suscripcion.hora_inicio and hora_inicio < suscripcion.hora_fin):
            hay_solapamiento = True
            break
        
        # Caso especial: si la suscripción termina a medianoche (00:00)
        if suscripcion.hora_fin == time(0, 0):
            if hora_inicio < time(0, 0):  # Si la nueva reserva empieza antes de medianoche
                hay_solapamiento = True
                break
    
    print(f"🔍 Solapamiento con suscripciones: {hay_solapamiento}")
    print(f"   - Suscripciones existentes: {len(suscripciones_existentes)}")
    for s in suscripciones_existentes:
        print(f"     * {s.hora_inicio} - {s.hora_fin}")
    
    return hay_solapamiento

def hay_solapamiento_reserva_suscripcion(db, cancha_id: int, fecha, hora_inicio: time, hora_fin: time, excluir_reserva_id: int = None) -> bool:
    """
    Verifica si hay solapamiento con reservas Y suscripciones existentes
    """
    from app.models.reserva import Reserva
    from app.models.suscripcion import Suscripcion
    from datetime import datetime
    
    # Obtener todas las reservas existentes para la fecha y cancha
    reservas_existentes = db.query(Reserva).filter(
        Reserva.cancha_id == cancha_id,
        Reserva.fecha == fecha,
        Reserva.estado != "cancelada"
    ).all()
    
    if excluir_reserva_id:
        reservas_existentes = [r for r in reservas_existentes if r.id != excluir_reserva_id]
    
    # Verificar solapamiento con reservas
    print(f"🔍 Verificando solapamiento con reservas:")
    hay_solapamiento_reservas = not validar_solapamiento_reservas(hora_inicio, hora_fin, reservas_existentes)
    
    # Verificar solapamiento con suscripciones
    fecha_obj = fecha if isinstance(fecha, date) else datetime.strptime(fecha, "%Y-%m-%d").date()
    dia_semana = fecha_obj.weekday()  # 0=lunes, 6=domingo
    
    # Obtener todas las suscripciones activas para el día de la semana y cancha
    suscripciones_existentes = db.query(Suscripcion).filter(
        Suscripcion.cancha_id == cancha_id,
        Suscripcion.dia_semana == dia_semana,
        Suscripcion.estado == "activa"
    ).all()
    
    # Usar la misma lógica de validación para suscripciones
    hay_solapamiento_suscripciones = False
    for suscripcion in suscripciones_existentes:
        # Verificar si hay solapamiento usando la misma lógica
        if (hora_inicio == suscripcion.hora_inicio and hora_fin == suscripcion.hora_fin) or \
           (hora_fin > suscripcion.hora_inicio and hora_inicio < suscripcion.hora_fin):
            hay_solapamiento_suscripciones = True
            break
        
        # Caso especial: si la suscripción termina a medianoche (00:00)
        if suscripcion.hora_fin == time(0, 0):
            if hora_inicio < time(0, 0):  # Si la nueva reserva empieza antes de medianoche
                hay_solapamiento_suscripciones = True
                break
    
    hay_solapamiento_total = hay_solapamiento_reservas or hay_solapamiento_suscripciones
    
    print(f"🔍 Solapamiento total: {hay_solapamiento_total}")
    print(f"   - Con reservas: {hay_solapamiento_reservas}")
    print(f"   - Con suscripciones: {hay_solapamiento_suscripciones}")
    
    return hay_solapamiento_total

def verificar_solapamiento_suscripcion_multiple_dias(db, cancha_id: int, dia_semana: int, hora_inicio: time, hora_fin: time, fecha_inicio: date, fecha_fin: date, excluir_suscripcion_id: int = None) -> bool:
    """
    Verifica si hay solapamiento con reservas Y suscripciones para todos los días de la suscripción
    """
    from datetime import timedelta
    
    print(f"🔍 Verificando solapamiento para suscripción:")
    print(f"   - Cancha: {cancha_id}")
    print(f"   - Día de semana: {dia_semana}")
    print(f"   - Horario: {hora_inicio} - {hora_fin}")
    print(f"   - Período: {fecha_inicio} a {fecha_fin}")
    
    # Generar todas las fechas del período que coincidan con el día de la semana
    fecha_actual = fecha_inicio
    fechas_a_verificar = []
    
    while fecha_actual <= fecha_fin:
        if fecha_actual.weekday() == dia_semana:
            fechas_a_verificar.append(fecha_actual)
        fecha_actual += timedelta(days=1)
    
    print(f"   - Fechas a verificar: {len(fechas_a_verificar)} fechas")
    
    # Verificar cada fecha
    for fecha in fechas_a_verificar:
        print(f"   - Verificando fecha: {fecha}")
        if hay_solapamiento_reserva_suscripcion(db, cancha_id, fecha, hora_inicio, hora_fin):
            print(f"   ❌ Solapamiento encontrado en fecha: {fecha}")
            return True
    
    print(f"   ✅ No hay solapamientos en ninguna fecha")
    return False 