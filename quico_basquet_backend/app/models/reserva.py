from app.data.database import Base
from sqlalchemy import Column, Float, Integer, String, ForeignKey, Date, Time
from sqlalchemy.orm import relationship

class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cancha_id = Column(Integer, ForeignKey("canchas.id"), nullable=False)
    deporte = Column(String, nullable=False)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    estado = Column(String, default="pendiente") # pendiente, confirmada, cancelada
    estado_pago = Column(String, default="pendiente") # pendiente, pagado, cancelado
    precio = Column(Float, nullable=False)
    pago_id = Column(String, nullable=True)
    metodo_pago = Column(String, nullable=False, default="efectivo") # "efectivo" o "transferencia"
    nombre_cliente = Column(String, nullable=True) # Nombre del cliente para reservas del admin

    user = relationship("User", back_populates="reservas")
    cancha = relationship("Cancha", back_populates="reservas")