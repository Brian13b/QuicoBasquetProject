 # test_main.py
# Pruebas básicas de los endpoints principales usando FastAPI TestClient y una base de datos SQLite en memoria
# Cada bloque está explicado paso a paso

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from quico_basquet_backend.app.main import app
from quico_basquet_backend.app.data.database import Base, get_db
import sys
import os

# 1. Configuración de la base de datos en memoria para pruebas
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 2. Sobrescribimos la dependencia get_db para usar la base de datos en memoria

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# 3. Creamos las tablas antes de correr los tests
@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

# 4. Test de registro de usuario

def test_register_user():
    response = client.post("/users/auth/register", json={
        "nombre": "Test User",
        "email": "test@example.com",
        "password": "testpass",
        "google_id": None,
        "rol": "user"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"

# 5. Test de login de usuario

def test_login_user():
    # Primero registramos el usuario (si no existe)
    client.post("/users/auth/register", json={
        "nombre": "Test User",
        "email": "test2@example.com",
        "password": "testpass",
        "google_id": None,
        "rol": "user"
    })
    # Ahora intentamos login
    response = client.post("/users/auth/login", data={
        "username": "test2@example.com",
        "password": "testpass"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

# 6. Test de listar canchas (debería estar vacío al inicio)

def test_listar_canchas():
    response = client.get("/canchas/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# 7. Test de crear y listar reservas (requiere usuario y cancha)
# NOTA: Este test es solo un esqueleto, ya que depende de la creación de canchas y usuarios válidos.
# Puedes completarlo según tu lógica de negocio y modelos.

# 8. Test de crear y listar suscripciones (requiere usuario)
# NOTA: Este test es solo un esqueleto, ya que depende de la creación de usuarios válidos.
# Puedes completarlo según tu lógica de negocio y modelos.

# Puedes agregar más tests siguiendo este esquema para cubrir todos los endpoints principales.
