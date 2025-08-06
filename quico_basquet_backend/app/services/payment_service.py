from datetime import datetime, time
from app.services.notification_service import send_whatsapp_message
from app.config.settings import settings

def calcular_costo(precio_por_hora: float, hora_inicio: time, hora_fin: time) -> float:
    """
    Calcula el costo de una reserva.
    """
    hoy = datetime.today()
    dt_inicio = datetime.combine(hoy, hora_inicio)
    dt_fin = datetime.combine(hoy, hora_fin)
    duracion_horas = (dt_fin - dt_inicio).total_seconds() / 3600
    costo = round(precio_por_hora * duracion_horas, 2)
    return costo

def obtener_info_pago(metodo_pago: str, monto: float) -> dict:
    """
    Devuelve la informacion de pago segun el metodo elegido
    """

    if metodo_pago == "efectivo":
        return {
            "metodo": "efectivo",
            "monto": monto,
            "mensaje": "El pago se realiza en efectivo al momento de usar la cancha."
        }
    elif metodo_pago == "transferencia":
        return {
            "metodo": "transferencia",
            "monto": monto,
            "alias": settings.DATOS_BANCARIOS["alias"],
            "cbu": settings.DATOS_BANCARIOS["cbu"],
            "banco": settings.DATOS_BANCARIOS["bank"],
            "titular": settings.DATOS_BANCARIOS["holder"],
            "whatsapp": settings.DATOS_BANCARIOS["whatsapp"],
            "mensaje": f"Realiza la transferencia al alias {settings.DATOS_BANCARIOS['alias']} o CBU {settings.DATOS_BANCARIOS['cbu']}."
        }
    else:
        return {
            "error": "Método de pago no soportado."
        }