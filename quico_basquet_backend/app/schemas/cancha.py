from pydantic import BaseModel, field_validator
from typing import Optional

class CanchaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    deportes_permitidos: str
    precio_basquet: float = 24000.0
    precio_voley: float = 15000.0
    descuento_basquet: float = 0.0
    descuento_voley: float = 0.0
    descuento_suscripcion: float = 5.0

    @field_validator('precio_basquet', 'precio_voley')
    @classmethod
    def validate_precios(cls, v):
        if v < 0:
            raise ValueError("El precio no puede ser negativo")
        return v

    @field_validator('descuento_basquet', 'descuento_voley', 'descuento_suscripcion')
    @classmethod
    def validate_descuentos(cls, v):
        if v < 0 or v > 100:
            raise ValueError("El descuento debe estar entre 0 y 100")
        return v

class CanchaCreate(CanchaBase):
    pass

class CanchaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    deportes_permitidos: Optional[str] = None
    precio_basquet: Optional[float] = None
    precio_voley: Optional[float] = None
    descuento_basquet: Optional[float] = None
    descuento_voley: Optional[float] = None
    descuento_suscripcion: Optional[float] = None

class CanchaOut(CanchaBase):
    id: int
    
    class Config:
        from_attributes = True

class CanchaPreciosUpdate(BaseModel):
    precio_basquet: float
    precio_voley: float
    descuento_basquet: float
    descuento_voley: float
    descuento_suscripcion: float 