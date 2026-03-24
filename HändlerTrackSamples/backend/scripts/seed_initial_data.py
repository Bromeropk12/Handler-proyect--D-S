"""
Script para inserir datos iniciales del sistema
Proveedores y Clases de Peligro GHS
"""

import sys
import os

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import SessionLocal, engine, Base
from models.proveedor import Proveedor
from models.clase_peligro import ClasePeligro
from models.user import User
from security import get_password_hash


def create_initial_data():
    """Inserta los datos iniciales requeridos"""
    
    # Crear tablas
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # ============ Verificar si ya existen datos ============
        existing_proveedores = db.query(Proveedor).count()
        existing_clases = db.query(ClasePeligro).count()
        
        if existing_proveedores > 0 or existing_clases > 0:
            print("Ya existen datos en la base de datos.")
            print(f"   Proveedores: {existing_proveedores}")
            print(f"   Clases de Peligro: {existing_clases}")
            print("Se agregaran los nuevos datos sin modificar los existentes.")
            # Continuar sin preguntar
        
        # ============ Proveedores Iniciales ============
        # Los 14 proveedores según la distribución de anaqueles
        proveedores_data = [
            {"nombre": "BASF Colombia", "nit": "900123456-1", "direccion": "Bogotá D.C.", "telefono": "6011234567", "email": "colombia@basf.com", "contacto_nombre": "Carlos Martínez"},
            {"nombre": "Evonik Industries", "nit": "900234567-2", "direccion": "Bogotá D.C.", "telefono": "6012345678", "email": "ventas@evonik.co", "contacto_nombre": "María López"},
            {"nombre": "Dow Chemical", "nit": "900345678-3", "direccion": "Bogotá D.C.", "telefono": "6013456789", "email": "info@dowco.com", "contacto_nombre": "Juan Pérez"},
            {"nombre": "Clariant Colombia", "nit": "900456789-4", "direccion": "Bogotá D.C.", "telefono": "6014567890", "email": "colombia@clariant.com", "contacto_nombre": "Ana García"},
            {"nombre": "Ashland Colombia", "nit": "900567890-5", "direccion": "Bogotá D.C.", "telefono": "6015678901", "email": "ventas.co@ashland.com", "contacto_nombre": "Roberto Sánchez"},
            {"nombre": "Croda Colombia", "nit": "900678901-6", "direccion": "Bogotá D.C.", "telefono": "6016789012", "email": "info@croda.co", "contacto_nombre": "Laura Torres"},
            {"nombre": "Gattefossé SAS", "nit": "900789012-7", "direccion": "Francia", "telefono": "+33112345678", "email": "export@gattefosse.fr", "contacto_nombre": "Pierre Dubois"},
            {"nombre": "Seppic SA", "nit": "900890123-8", "direccion": "Francia", "telefono": "+33123456789", "email": "contact@seppic.com", "contacto_nombre": "Sophie Martin"},
            {"nombre": "DSM Nutritional", "nit": "900901234-9", "direccion": "Suiza", "telefono": "+41216278910", "email": "info@dsm.com", "contacto_nombre": "Hans Mueller"},
            {"nombre": "Lubrizol Colombia", "nit": "901012345-1", "direccion": "Bogotá D.C.", "telefono": "6010123456", "email": "co@lubrizol.com", "contacto_nombre": "Diego Rivera"},
            {"nombre": "Merck Colombia", "nit": "901123456-2", "direccion": "Bogotá D.C.", "telefono": "6011234560", "email": "merck.co@merck.com", "contacto_nombre": "Claudia Hernández"},
            {"nombre": "BASF Healthcare", "nit": "901234567-3", "direccion": "Alemania", "telefono": "+49621123456", "email": "pharma@basf.com", "contacto_nombre": "Klaus Weber"},
            {"nombre": "DSM Pharmaceutical", "nit": "901345678-4", "direccion": "Países Bajos", "telefono": "+31201234567", "email": "pharma@dsm.com", "contacto_nombre": "Jan van Berg"},
            {"nombre": "Symrise AG", "nit": "901456789-5", "direccion": "Alemania", "telefono": "+4951123456", "email": "info@symrise.de", "contacto_nombre": "Maria Schmidt"},
        ]
        
        print("\nInsertando proveedores...")
        for prov_data in proveedores_data:
            existing = db.query(Proveedor).filter(Proveedor.nit == prov_data["nit"]).first()
            if not existing:
                proveedor = Proveedor(**prov_data)
                db.add(proveedor)
                print(f"   OK {prov_data['nombre']}")
        
        # Commit proveedores first
        db.commit()
        print(f"   Total proveedores: {db.query(Proveedor).count()}")
        
        # ============ Clases de Peligro GHS (9 clases) ============
        clases_ghs = [
            {"codigo": "GHS01", "nombre": "Explosivo", "descripcion": "Sustancias y mezclas explosivas", "simbolo": "explosive", "color": "naranja"},
            {"codigo": "GHS02", "nombre": "Inflamable", "descripcion": "Líquidos inflamables, sólidos inflamables, gases comprimidos inflamables", "simbolo": "flame", "color": "rojo"},
            {"codigo": "GHS03", "nombre": "Comburente", "descripcion": "Sustancias comburentes que pueden causar o contribuir a la combustión", "simbolo": "flame-over-circle", "color": "amarillo"},
            {"codigo": "GHS04", "nombre": "Gas a presión", "descripcion": "Gases comprimidos, licuados o disueltos", "simbolo": "gas-cylinder", "color": "rojo"},
            {"codigo": "GHS05", "nombre": "Corrosivo", "descripcion": "Sustancias corrosivas para metales y piel", "simbolo": "corrosion", "color": "negro"},
            {"codigo": "GHS06", "nombre": "Tóxico agudo", "descripcion": "Sustancias tóxicas por ingestión, inhalación o contacto", "simbolo": "skull-crossbones", "color": "negro"},
            {"codigo": "GHS07", "nombre": "Irritante", "descripcion": "Sustancias que pueden causar irritación cutánea u ocular", "simbolo": "exclamation-mark", "color": "amarillo"},
            {"codigo": "GHS08", "nombre": "Peligro para la salud", "descripcion": "Carcinógenos, mutagenos, toxicidad reproductiva", "simbolo": "health-hazard", "color": "negro"},
            {"codigo": "GHS09", "nombre": "Peligroso para el medio ambiente", "descripcion": "Sustancias tóxicas para organismos acuáticos", "simbolo": "environment", "color": "negro"},
        ]
        
        print("\nInsertando clases de peligro GHS...")
        for clase_data in clases_ghs:
            existing = db.query(ClasePeligro).filter(ClasePeligro.codigo == clase_data["codigo"]).first()
            if not existing:
                clase = ClasePeligro(**clase_data)
                db.add(clase)
                print(f"   OK {clase_data['codigo']} - {clase_data['nombre']}")
        
        # ============ Commit ============
        db.commit()
        
        print("\nDatos iniciales insertados correctamente.")
        
        # Mostrar resumen
        print("\nResumen:")
        print(f"   Proveedores: {db.query(Proveedor).count()}")
        print(f"   Clases de Peligro: {db.query(ClasePeligro).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_initial_data()