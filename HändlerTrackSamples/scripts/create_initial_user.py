"""
Script para crear el usuario administrador inicial.
Este script crea un usuario con contraseña segura generada aleatoriamente.
"""
import os
import sys
import secrets
import string

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database.database import SessionLocal
from models.user import User
from security import get_password_hash

def generate_secure_password(length: int = 16) -> str:
    """Genera una contraseña segura aleatoria"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        # Verificar que cumple requisitos
        if (any(c.islower() for c in password)
            and any(c.isupper() for c in password)
            and any(c.isdigit() for c in password)
            and any(c in "!@#$%^&*" for c in password)):
            return password

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
        
        # Generar contraseña segura
        secure_password = generate_secure_password()
        
        # Crear usuario administrador
        admin_user = User(
            username="admin",
            email="admin@handler.com",
            full_name="Administrador",
            hashed_password=get_password_hash(secure_password),
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
        print(f"Contraseña temporal: {secure_password}")
        print("\n⚠️ IMPORTANTE!")
        print("1. Guarde esta contraseña en un lugar seguro")
        print("2. Cambie la contraseña después del primer login")
        print("3. La contraseña solo se muestra una vez")
        
        # Guardar contraseña en archivo temporal (solo para desarrollo)
        password_file = os.path.join(os.path.dirname(__file__), '..', '.admin_password.txt')
        with open(password_file, 'w') as f:
            f.write(f"Usuario: admin\nContraseña: {secure_password}\n")
            f.write(f"Fecha: {datetime.now().isoformat()}\n")
        print(f"\n(Contraseña guardada en: {password_file})")
        
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    from datetime import datetime
    success = create_initial_user()
    sys.exit(0 if success else 1)
