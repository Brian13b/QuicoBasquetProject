from pydantic import BaseModel, validator
from datetime import date, time
from typing import Optional, List
from enum import Enum

class EstadoSuscripcion(str, Enum):
    activa = "activa"
    vencida = "vencida"
    cancelada = "cancelada"
    pendiente = "pendiente"

class EstadoPagoSuscripcion(str, Enum):
    pendiente = "pendiente"
    aprobado = "aprobado"
    rechazado = "rechazado"

class SuscripcionCreate(BaseModel):
    user_id: int
    cancha_id: int
    deporte: str
    dia_semana: int  # 0=lunes, 6=domingo
    hora_inicio: time
    hora_fin: time
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    estado_pago: Optional[str] = "pendiente"
    precio_mensual: float
    descuento: float = 0.0  # Porcentaje de descuento
    metodo_pago: str

    @validator('dia_semana')
    def validate_dia_semana(cls, v):
        if not 0 <= v <= 6:
            raise ValueError('Día de semana debe estar entre 0 (lunes) y 6 (domingo)')
        return v

    @validator('fecha_fin')
    def validate_fecha_fin(cls, v, values):
        if v and 'fecha_inicio' in values and v <= values['fecha_inicio']:
            raise ValueError('La fecha de fin debe ser posterior a la fecha de inicio')
        return v

class SuscripcionUpdate(BaseModel):
    estado: Optional[EstadoSuscripcion] = None
    estado_pago: Optional[EstadoPagoSuscripcion] = None
    fecha_fin: Optional[date] = None
    precio_mensual: Optional[float] = None
    descuento: Optional[float] = None

class SuscripcionOut(BaseModel):
    id: int
    user_id: int
    cancha_id: int
    deporte: str
    dia_semana: int
    hora_inicio: time
    hora_fin: time
    fecha_inicio: date
    fecha_fin: Optional[date]
    estado: str
    estado_pago: str
    precio_mensual: float
    descuento: float
    metodo_pago: str
    pago_id: Optional[str]
    
    # Información relacionada
    cancha_nombre: Optional[str] = None
    user_nombre: Optional[str] = None

    class Config:
        from_attributes = True

class SuscripcionMultipleCreate(BaseModel):
    suscripciones: List[SuscripcionCreate]

class SuscripcionRenovacion(BaseModel):
    suscripcion_id: int
    nueva_fecha_fin: date
    precio_mensual: float 