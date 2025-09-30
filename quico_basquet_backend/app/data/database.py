from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

CONNECTION_DB = os.getenv("DATABASE_URL")

# 🚀 CONFIGURACIÓN OPTIMIZADA PARA NEON + RENDER
engine = create_engine(
    CONNECTION_DB,
    # Pool de conexiones optimizado
    pool_size=10,           # Mantener 10 conexiones activas
    max_overflow=20,        # Hasta 20 conexiones adicionales
    pool_pre_ping=True,     # Verificar conexiones antes de usar
    pool_recycle=3600,      # Reciclar conexiones cada hora
    
    # Optimizaciones para Neon serverless
    connect_args={
        "sslmode": "require",
        "connect_timeout": 10,
        "application_name": "quico_basquet_backend"
    },
    
    # Echo para debugging en desarrollo
    echo=False  # Cambiar a True para ver todas las queries
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()