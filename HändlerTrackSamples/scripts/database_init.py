"""
Script para inicializar la base de datos MySQL de Händler TrackSamples.
Este script crea la base de datos y todas las tablas necesarias.
"""
from sqlalchemy import create_engine, inspect
from sqlalchemy_utils import database_exists, create_database
import os
import sys

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv

def init_db():
    """Inicializa la base de datos MySQL"""
    
    # Cargar variables de entorno
    load_dotenv()
    
    # Obtener URL de la base de datos
    DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/hander_track_samples")
    
    print("=" * 60)
    print("INICIALIZACIÓN DE BASE DE DATOS - HÄNDLER TRACKSAMPLES")
    print("=" * 60)
    print(f"\nURL de conexión: {DATABASE_URL}")
    
    try:
        # Crear conexión sin especificar base de datos
        db_url_parts = DATABASE_URL.rsplit('/', 1)
        base_url = db_url_parts[0] + '/mysql'
        
        print(f"\nConectando a MySQL...")
        engine = create_engine(base_url)
        
        # Obtener nombre de la base de datos
        db_name = "hander_track_samples"
        
        # Verificar si la base de datos existe
        with engine.connect() as conn:
            result = conn.execute(f"SHOW DATABASES LIKE '{db_name}'")
            db_exists = result.fetchone() is not None
            
            if not db_exists:
                print(f"Creando base de datos: {db_name}")
                conn.execute(f"CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
                print(f"✓ Base de datos '{db_name}' creada exitosamente")
            else:
                print(f"✓ Base de datos '{db_name}' ya existe")
        
        # Ahora conectar a la base de datos específica
        print(f"\nConectando a la base de datos '{db_name}'...")
        engine = create_engine(DATABASE_URL)
        
        # Importar todos los modelos
        print("\nImportando modelos...")
        from models.sample import Sample
        from models.user import User
        from models.movement import Movement
        from models.chemical_compatibility import ChemicalCompatibility
        from database.database import Base
        
        # Crear tablas
        print("\nVerificando tablas existentes...")
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        print(f"Tablas existentes: {existing_tables}")
        
        # Crear tablas que no existen
        print("\nCreando tablas...")
        Base.metadata.create_all(bind=engine)
        
        # Verificar tablas creadas
        inspector = inspect(engine)
        new_tables = inspector.get_table_names()
        
        print("\n" + "=" * 60)
        print("TABLAS CREADAS/VERIFICADAS:")
        print("=" * 60)
        for table in new_tables:
            print(f"  ✓ {table}")
        
        print("\n" + "=" * 60)
        print("✓ INICIALIZACIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 60)
        print(f"\nLa base de datos '{db_name}' está lista para usar.")
        print(f"Puedes iniciar el servidor con: python backend/main.py")
        
        return True
        
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        print("\nPosibles soluciones:")
        print("1. Verifica que MySQL esté ejecutándose")
        print("2. Verifica las credenciales en el archivo .env")
        print("3. Verifica que el usuario tenga permisos para crear bases de datos")
        return False

if __name__ == "__main__":
    success = init_db()
    sys.exit(0 if success else 1)
