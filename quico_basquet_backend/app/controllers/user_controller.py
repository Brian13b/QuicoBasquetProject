from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserOut, FirebaseTokenRequest, FirebaseUserData
from app.models.user import User
from app.data.database import get_db
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user, require_admin
from app.services.firebase_service import verify_firebase_token
from fastapi.security import OAuth2PasswordRequestForm
import datetime
from typing import List, Optional

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/health")
def health_check():
    """Endpoint para verificar que el servicio está funcionando"""
    import time
    return {
        "status": "ok",
        "firebase_available": verify_firebase_token is not None,
        "message": "API de usuarios funcionando correctamente",
        "server_time": int(time.time()),
        "server_time_iso": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }

@router.post("/auth/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Verificar si el email ya existe
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Hash de la contraseña
    hashed_pw = hash_password(user_in.password)
    
    # Crear el usuario (fecha_registro se establecerá automáticamente)
    user = User(
        nombre=user_in.nombre,
        email=user_in.email,
        password_hash=hashed_pw,
        google_id=user_in.google_id,  # Será None si no se proporciona
        telefono=user_in.telefono,
        rol=user_in.rol
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    access_token = create_access_token({"user_id": user.id, "rol": user.rol})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/firebase")
def firebase_auth(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """
    Autentica usuario con Firebase ID Token desde el header Authorization
    - Si el usuario existe: hace login
    - Si no existe: crea nuevo usuario automáticamente
    """
    
    # Verificar que Firebase esté disponible
    if not verify_firebase_token:
        raise HTTPException(
            status_code=503,
            detail="Servicio de Firebase no disponible. Verifique la configuración."
        )
    
    # Extraer el token del header Authorization
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Token de autorización requerido en formato 'Bearer <token>'"
        )
    
    firebase_token = authorization.replace("Bearer ", "")
    
    firebase_user_data = verify_firebase_token(firebase_token)
    
    if not firebase_user_data:
        raise HTTPException(
            status_code=401, 
            detail="Token de Firebase inválido o expirado"
        )
    
    # Extraer datos del usuario desde Firebase
    firebase_uid = firebase_user_data["uid"]
    email = firebase_user_data["email"]
    name = firebase_user_data["name"] or "Usuario Firebase"
    
    if not email:
        raise HTTPException(
            status_code=400,
            detail="El usuario de Firebase debe tener un email válido"
        )
    
    # Buscar usuario existente por google_id o email
    user = db.query(User).filter(
        (User.google_id == firebase_uid) | (User.email == email)
    ).first()
    
    if user:
        # Usuario existe, hacer login
        access_token = create_access_token({"user_id": user.id, "rol": user.rol})
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "nombre": user.nombre,
                "email": user.email,
                "rol": user.rol
            }
        }
    else:
        # Usuario no existe, crear nuevo usuario
        new_user = User(
            nombre=name,
            email=email,
            google_id=firebase_uid,
            password_hash="",  # Usuarios de Firebase no tienen contraseña
            rol="usuario"
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        access_token = create_access_token({"user_id": new_user.id, "rol": new_user.rol})
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": {
                "id": new_user.id,
                "nombre": new_user.nombre,
                "email": new_user.email,
                "rol": new_user.rol
            }
        }

@router.post("/auth/register-firebase")
def register_with_firebase(user_data: FirebaseUserData, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """
    Registra un usuario con datos adicionales usando Firebase ID Token
    """
    
    # Verificar que Firebase esté disponible
    if not verify_firebase_token:
        raise HTTPException(
            status_code=503,
            detail="Servicio de Firebase no disponible. Verifique la configuración."
        )
    
    # Extraer el token del header Authorization
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Token de autorización requerido en formato 'Bearer <token>'"
        )
    
    firebase_token = authorization.replace("Bearer ", "")
    
    # Verificar el token con Firebase
    firebase_user_data = verify_firebase_token(firebase_token)
    
    if not firebase_user_data:
        raise HTTPException(
            status_code=401, 
            detail="Token de Firebase inválido o expirado"
        )
    
    # Verificar que el email del token coincida con el email proporcionado
    if firebase_user_data["email"] != user_data.email:
        raise HTTPException(
            status_code=400,
            detail="El email del token de Firebase no coincide con el email proporcionado"
        )
    
    # Buscar usuario existente
    existing_user = db.query(User).filter(
        (User.google_id == firebase_user_data["uid"]) | (User.email == firebase_user_data["email"])
    ).first()
    
    if existing_user:
        # Actualizar datos del usuario existente
        existing_user.nombre = user_data.name or firebase_user_data.get("name", existing_user.nombre)
        existing_user.telefono = user_data.phone
        existing_user.google_id = firebase_user_data["uid"]  # Asegurar que tenga el google_id
        
        db.commit()
        db.refresh(existing_user)
        
        # Crear token de acceso
        access_token = create_access_token({"user_id": existing_user.id, "rol": existing_user.rol})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": existing_user,
            "action": "update"
        }
    else:
        # Crear nuevo usuario con los datos adicionales
        new_user = User(
            nombre=user_data.name or firebase_user_data.get("name", "Usuario Firebase"),
            email=firebase_user_data["email"],
            password_hash="",  # No necesita contraseña para Firebase
            google_id=firebase_user_data["uid"],
            telefono=user_data.phone,
            rol="usuario"
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Crear token de acceso
        access_token = create_access_token({"user_id": new_user.id, "rol": new_user.rol})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": new_user,
            "action": "register"
        }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user 

@router.get("/", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(User).all()

@router.get("/all", response_model=List[UserOut])
def get_all_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtener todos los usuarios (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden ver todos los usuarios.")
    
    usuarios = db.query(User).order_by(User.fecha_registro.desc()).all()
    return usuarios

@router.patch("/{user_id}/bloquear", response_model=UserOut)
def bloquear_usuario_endpoint(
    user_id: int, 
    bloqueo_data: dict, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Bloquear o desbloquear un usuario (solo para administradores)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores pueden bloquear usuarios.")
    
    usuario = db.query(User).filter(User.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    nuevo_estado = bloqueo_data.get("bloqueado")
    if nuevo_estado not in ["activo", "bloqueado"]:
        raise HTTPException(status_code=400, detail="Estado inválido. Debe ser 'activo' o 'bloqueado'")
    
    usuario.bloqueado = nuevo_estado
    db.commit()
    db.refresh(usuario)
    
    return usuario
