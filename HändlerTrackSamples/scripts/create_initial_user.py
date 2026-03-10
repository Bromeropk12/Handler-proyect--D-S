"""
Script para crear el usuario administrador inicial.
Este script crea un usuario con credenciales por defecto.
"""
import os
import sys

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database.database import SessionLocal
from models.user import User
from security import get_password_hash

def create_initial_user():
    """Crea el usuario administrador inicial"""
    
    db = SessionLocal()
    
    try:
        # Verificar si ya existe un usuario
        existing_user = db.query(User).first()
        
        if existing_user:
            print("Ya existe un usuario en la base de datos.")
            print(f"Usuario: {existing_user.username}")
            return False
        
        # Crear usuario administrador
        admin_user = User(
            username="admin",
            email="admin@handler.com",
            full_name="Administrador",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("=" * 60)
        print("USUARIO ADMINISTRADOR CREADO")
        print("=" * 60)
        print(f"Usuario: admin")
        print(f"Contrasena: admin123")
        print("\nIMPORTANTE! Cambia la contrasena despues del primer login.")
        
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    success = create_initial_user()
    sys.exit(0 if success else 1)
