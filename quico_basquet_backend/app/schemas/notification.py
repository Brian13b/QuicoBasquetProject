from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class NotificationCreate(BaseModel):
    tipo: str
    asunto: str
    mensaje: str
    destinatarios: str
    usuario_id_especifico: Optional[int] = None

    @field_validator('tipo')
    @classmethod
    def validate_tipo(cls, v):
        tipos_validos = ['general', 'mantenimiento', 'promocion', 'reserva', 'suscripcion']
        if v not in tipos_validos:
            raise ValueError(f'Tipo debe ser uno de: {tipos_validos}')
        return v

    @field_validator('destinatarios')
    @classmethod
    def validate_destinatarios(cls, v):
        destinatarios_validos = ['todos', 'activos', 'especifico']
        if v not in destinatarios_validos:
            raise ValueError(f'Destinatarios debe ser uno de: {destinatarios_validos}')
        return v

    @field_validator('asunto')
    @classmethod
    def validate_asunto(cls, v):
        if not v or not v.strip():
            raise ValueError('El asunto es requerido')
        if len(v) > 200:
            raise ValueError('El asunto no puede tener más de 200 caracteres')
        return v.strip()

    @field_validator('mensaje')
    @classmethod
    def validate_mensaje(cls, v):
        if not v or not v.strip():
            raise ValueError('El mensaje es requerido')
        return v.strip()

    @field_validator('usuario_id_especifico')
    @classmethod
    def validate_usuario_id_especifico(cls, v, values):
        if values.data.get('destinatarios') == 'especifico' and v is None:
            raise ValueError('usuario_id_especifico es requerido cuando destinatarios es "especifico"')
        return v

class NotificationOut(BaseModel):
    id: int
    tipo: str
    asunto: str
    mensaje: str
    destinatarios: str
    usuario_id_especifico: Optional[int]
    enviado_por: int
    enviados_exitosos: int
    enviados_fallidos: int
    total_destinatarios: int
    fecha_envio: datetime
    estado: str
    
    class Config:
        from_attributes = True

class NotificationHistory(BaseModel):
    id: int
    tipo: str
    asunto: str
    destinatarios: str
    enviados_exitosos: int
    total_destinatarios: int
    fecha_envio: datetime
    estado: str
    
    class Config:
        from_attributes = True 