from app.data.database import Base
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.sql import func

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    google_id = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    rol = Column(String, default="usuario")  # "usuario" o "admin"
    bloqueado = Column(String, default="activo")  # "activo" o "bloqueado"
    fecha_registro = Column(DateTime, default=func.now(), nullable=False)

    reservas = relationship("Reserva", back_populates="user")
    suscripciones = relationship("Suscripcion", back_populates="user")