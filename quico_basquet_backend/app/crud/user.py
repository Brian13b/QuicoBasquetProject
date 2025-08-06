from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from typing import Optional, List

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Obtener usuario por ID"""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Obtener usuario por email"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
    """Obtener usuario por Google ID"""
    return db.query(User).filter(User.google_id == google_id).first()

def create_user(db: Session, user_data: UserCreate, password_hash: str) -> User:
    """Crear nuevo usuario"""
    user = User(
        nombre=user_data.nombre,
        email=user_data.email,
        password_hash=password_hash,
        google_id=user_data.google_id,
        telefono=user_data.telefono,
        rol=user_data.rol
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Obtener todos los usuarios con paginación"""
    return db.query(User).offset(skip).limit(limit).all()

def update_user(db: Session, user_id: int, **kwargs) -> Optional[User]:
    """Actualizar usuario"""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    for key, value in kwargs.items():
        if hasattr(user, key):
            setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user 