from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers import user_controller, reserva_controller, cancha_controller, suscripcion_controller, notification_controller, admin_controller
from app.data.database import engine, Base
# Importar modelos para que se creen las tablas
from app.models import user, cancha, reserva, suscripcion, notification
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear tablas
Base.metadata.create_all(bind=engine)

# Crear aplicación FastAPI
app = FastAPI(title="Quico Básquet API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://quicobasquet.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar Firebase
try:
    from app.services.firebase_service import firebase_service
    if firebase_service:
        logger.info("Firebase inicializado correctamente")
    else:
        logger.warning("Firebase no disponible - solo funciones básicas disponibles")
except Exception as e:
    logger.warning(f"Error al inicializar Firebase: {e}")
    logger.warning("Continuando sin Firebase - solo funciones básicas disponibles")

# Incluir routers
app.include_router(user_controller.router)
app.include_router(reserva_controller.router)
app.include_router(cancha_controller.router)
app.include_router(suscripcion_controller.router)
app.include_router(notification_controller.router)
app.include_router(admin_controller.router)

@app.get("/")
def read_root():
    return {"message": "API de Quico Básquet funcionando correctamente"}

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API funcionando correctamente"} 