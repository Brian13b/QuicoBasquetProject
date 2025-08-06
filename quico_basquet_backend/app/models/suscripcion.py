from sqlalchemy import Column, Integer, String, ForeignKey, Date, Time, Float
from sqlalchemy.orm import relationship
from app.data.database import Base

class Suscripcion(Base):
    __tablename__ = "suscripciones"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cancha_id = Column(Integer, ForeignKey("canchas.id"), nullable=False)
    deporte = Column(String, nullable=False)
    dia_semana = Column(Integer, nullable=False)  # 0=lunes, 6=domingo
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=True)
    estado = Column(String, default="activa")  # activa, vencida, cancelada, pendiente
    estado_pago = Column(String, default="pendiente")  # pendiente, aprobado, rechazado
    precio_mensual = Column(Float, nullable=True, default=0.0)
    descuento = Column(Float, default=0.0)  # Porcentaje de descuento (0-100)
    metodo_pago = Column(String, nullable=False)
    pago_id = Column(String, nullable=True)  # referencia a MercadoPago

    user = relationship("User", back_populates="suscripciones")
    cancha = relationship("Cancha", back_populates="suscripciones")