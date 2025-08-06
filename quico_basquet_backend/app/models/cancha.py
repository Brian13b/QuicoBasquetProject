from app.data.database import Base
from sqlalchemy import Column, Float, Integer, String
from sqlalchemy.orm import relationship

class Cancha(Base):
    __tablename__ = "canchas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(String)
    deportes_permitidos = Column(String, nullable=False)  # Ejemplo: "basquet,voley"
    
    # Precios por deporte
    precio_basquet = Column(Float, nullable=False, default=24000.0)
    precio_voley = Column(Float, nullable=False, default=15000.0)
    
    # Descuentos por deporte
    descuento_basquet = Column(Float, nullable=False, default=0.0)
    descuento_voley = Column(Float, nullable=False, default=0.0)
    
    # Descuento especial para suscripciones
    descuento_suscripcion = Column(Float, nullable=False, default=5.0)

    reservas = relationship("Reserva", back_populates="cancha")
    suscripciones = relationship("Suscripcion", back_populates="cancha")