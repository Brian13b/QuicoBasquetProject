from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    nombre: str
    email: EmailStr
    telefono: Optional[str] = None
    rol: Optional[str] = "usuario"
    bloqueado: Optional[str] = "activo"

class UserCreate(UserBase):
    password: str
    google_id: Optional[str] = None

class FirebaseTokenRequest(BaseModel):
    """Esquema para recibir el token de Firebase desde el frontend"""
    id_token: str
    
    @validator('id_token')
    def validate_id_token(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('ID token de Firebase es requerido')
        return v.strip()

class FirebaseUserData(BaseModel):
    """Esquema para datos adicionales del usuario en registro con Firebase"""
    email: EmailStr
    name: Optional[str] = None
    phone: Optional[str] = None
    firebase_uid: Optional[str] = None

class UserOut(UserBase):
    id: int
    fecha_registro: datetime
    google_id: Optional[str] = None
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    
    class Config:
        from_attributes = True 