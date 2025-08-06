from pydantic import BaseModel, field_validator
from typing import Optional, Union
from datetime import date, time
from enum import Enum

class MetodoPagoEnum(str, Enum):
    efectivo = "efectivo"
    transferencia = "transferencia"

class ReservaBase(BaseModel):
    cancha_id: int
    deporte: str
    fecha: date
    hora_inicio: time
    hora_fin: time
    estado: Optional[str] = "confirmada"
    estado_pago: Optional[str] = "pendiente"
    pago_id: Optional[str] = None
    metodo_pago: MetodoPagoEnum = MetodoPagoEnum.efectivo

    @field_validator('fecha', mode='before')
    @classmethod
    def validate_fecha(cls, v):
        """Validar y normalizar la fecha para evitar problemas de zona horaria"""
        if isinstance(v, str):
            # Si es string, asegurar que solo tenga la fecha (sin tiempo)
            if 'T' in v:
                v = v.split('T')[0]
            elif ' ' in v:
                v = v.split(' ')[0]
            
            # Parsear como date directamente
            try:
                return date.fromisoformat(v)
            except ValueError:
                raise ValueError(f"Formato de fecha inválido: {v}")
        
        return v

class ReservaCreate(ReservaBase):
    precio: Optional[float] = None  # Opcional, el backend lo calculará

class ReservaUpdate(BaseModel):
    cancha_id: Optional[int] = None
    deporte: Optional[str] = None
    fecha: Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    estado: Optional[str] = None
    estado_pago: Optional[str] = None
    precio: Optional[float] = None
    pago_id: Optional[str] = None
    metodo_pago: Optional[MetodoPagoEnum] = None

class ReservaInternal(ReservaBase):
    user_id: int
    precio: float  # Requerido en el modelo interno

class ReservaOut(ReservaInternal):
    id: int
    class Config:
        from_attributes = True

# Nuevo schema para respuestas combinadas (reservas + suscripciones)
class ReservaCombinadaOut(BaseModel):
    id: Union[int, str]  # Puede ser int (reserva) o str (suscripcion_X)
    user_id: int
    cancha_id: int
    deporte: str
    fecha: Union[date, str]  # Puede ser date o string
    hora_inicio: time
    hora_fin: time
    precio: float
    metodo_pago: str
    estado: str
    estado_pago: str
    tipo: Optional[str] = None  # "suscripcion" o None para reservas normales
    dia_semana: Optional[int] = None  # Solo para suscripciones
    fecha_inicio: Optional[Union[date, str]] = None  # Solo para suscripciones
    fecha_fin: Optional[Union[date, str]] = None  # Solo para suscripciones
    descuento: Optional[float] = None  # Solo para suscripciones
    
    class Config:
        from_attributes = True 