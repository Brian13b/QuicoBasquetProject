# Quico Basquet Backend

API REST para la gestión de reservas, suscripciones, usuarios y pagos del club Quico Básquet.

## Funcionalidades principales

- Registro e inicio de sesión (email/Google)
- Reserva de turnos para básquet o vóley
- Suscripciones mensuales
- Notificaciones automáticas
- Panel administrativo

## Tecnologías

- Python (FastAPI)
- SQLAlchemy
- PostgreSQL
- Firebase

## Instalación y ejecución

1. Crea un entorno virtual e instala las dependencias:
	```bash
	python -m venv venv
	venv\Scripts\activate 
	pip install -r requirements.txt
	```
2. Configura las variables de entorno y credenciales necesarias (Firebase, MercadoPago, etc).
3. Ejecuta el servidor:
	```bash
	uvicorn app.main:app --reload
	```

## Estructura principal

- `app/` – Código fuente principal (controladores, modelos, servicios, etc)
- `migrations/` – Migraciones de base de datos
- `tests/` – Pruebas automáticas

---
Desarrollado por Brian Battauz.
