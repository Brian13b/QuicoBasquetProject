from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.data.database import Base

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(50), nullable=False)  # "general", "mantenimiento", "promocion", "reserva", "suscripcion"
    asunto = Column(String(200), nullable=False)
    mensaje = Column(Text, nullable=False)
    destinatarios = Column(String(50), nullable=False)  # "todos", "activos", "especifico"
    usuario_id_especifico = Column(Integer, ForeignKey("users.id"), nullable=True)
    enviado_por = Column(Integer, ForeignKey("users.id"), nullable=False)
    enviados_exitosos = Column(Integer, default=0)
    enviados_fallidos = Column(Integer, default=0)
    total_destinatarios = Column(Integer, default=0)
    fecha_envio = Column(DateTime(timezone=True), server_default=func.now())
    estado = Column(String(20), default="enviado")  # "enviado", "error", "pendiente"
    
    # Relaciones
    usuario_especifico = relationship("User", foreign_keys=[usuario_id_especifico])
    admin_enviador = relationship("User", foreign_keys=[enviado_por])
    
    def __repr__(self):
        return f"<Notification(id={self.id}, tipo='{self.tipo}', destinatarios='{self.destinatarios}')>" 