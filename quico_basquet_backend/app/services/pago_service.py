from app.schemas.reserva import MetodoPagoEnum
from app.config.settings import settings

def obtener_info_pago(metodo_pago: str, precio: float) -> dict:
    """
    Obtiene la información de pago según el método seleccionado
    """
    if metodo_pago == MetodoPagoEnum.transferencia:
        return {
            "metodo": "transferencia",
            "alias": settings.DATOS_BANCARIOS.get("alias", "ALIAS_NO_CONFIGURADO"),
            "cbu": settings.DATOS_BANCARIOS.get("cbu", "CBU_NO_CONFIGURADO"),
            "banco": settings.DATOS_BANCARIOS.get("bank", "BANCO_NO_CONFIGURADO"),
            "titular": settings.DATOS_BANCARIOS.get("holder", "TITULAR_NO_CONFIGURADO"),
            "monto": precio
        }
    else:  # efectivo
        return {
            "metodo": "efectivo",
            "monto": precio,
            "mensaje": "Pago en efectivo al momento de la reserva"
        } 