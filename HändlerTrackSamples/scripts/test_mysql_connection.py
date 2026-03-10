"""
Script para verificar la conexión a MySQL.
"""
import pymysql
import os
from dotenv import load_dotenv

def test_mysql_connection():
    """Prueba la conexión a MySQL"""
    
    # Cargar variables de entorno
    load_dotenv()
    
    # Obtener configuración
    db_url = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/hander_track_samples")
    
    # Extraer componentes de la URL
    # Formato: mysql+pymysql://user:password@host:port/database
    db_url = db_url.replace("mysql+pymysql://", "")
    parts = db_url.split("@")
    credentials = parts[0].split(":")
    host_db = parts[1].split("/")
    host_port = host_db[0].split(":")
    
    user = credentials[0]
    password = credentials[1]
    host = host_port[0]
    port = int(host_port[1]) if len(host_port) > 1 else 3306
    database = host_db[1] if len(host_db) > 1 else None
    
    print("=" * 60)
    print("PRUEBA DE CONEXIÓN A MySQL")
    print("=" * 60)
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"User: {user}")
    print(f"Database: {database}")
    print()
    
    try:
        # Intentar conexión
        print("Intentando conectar...")
        connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            connect_timeout=10
        )
        
        print("✓ Conexión exitosa!")
        
        # Obtener versión de MySQL
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"Versión de MySQL: {version[0]}")
            
            # Listar bases de datos
            if database is None:
                cursor.execute("SHOW DATABASES")
                print("\nBases de datos disponibles:")
                for db in cursor.fetchall():
                    print(f"  - {db[0]}")
        
        connection.close()
        print("\n✓ PRUEBA DE CONEXIÓN EXITOSA")
        return True
        
    except pymysql.err.OperationalError as e:
        print(f"✗ Error de conexión: {e}")
        
        if e.args[0] == 1045:
            print("\n→ El usuario o contraseña son incorrectos.")
            print("→ Verifica las credenciales en el archivo .env")
        elif e.args[0] == 2003:
            print("\n→ No se puede conectar al servidor MySQL.")
            print("→ Verifica que MySQL esté ejecutándose")
        elif e.args[0] == 1049:
            print("\n→ La base de datos no existe.")
            print("→ Ejecuta el script database_init.py para crearla")
        
        return False
        
    except Exception as e:
        print(f"✗ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    test_mysql_connection()
