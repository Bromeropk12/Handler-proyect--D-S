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
from models.linea import Linea
from models.anaquel import Anaquel
from models.hilera import Hilera
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
        
        # ============ Commit de clases ============
        db.commit()
        
        # ============ Líneas de Negocio ============
        lineas_data = [
            {"nombre": "Cosméticos", "descripcion": "Línea de negocio para productos cosméticos"},
            {"nombre": "Industrial", "descripcion": "Línea de negocio para productos industriales"},
            {"nombre": "Farmacéutico", "descripcion": "Línea de negocio para productos farmacéuticos"},
        ]
        
        print("\nInsertando líneas de negocio...")
        for linea_data in lineas_data:
            existing = db.query(Linea).filter(Linea.nombre == linea_data["nombre"]).first()
            if not existing:
                linea = Linea(**linea_data)
                db.add(linea)
                print(f"   OK {linea_data['nombre']}")
        
        db.commit()
        
        # Obtener IDs de líneas
        linea_cosmeticos = db.query(Linea).filter(Linea.nombre == "Cosméticos").first()
        linea_industrial = db.query(Linea).filter(Linea.nombre == "Industrial").first()
        linea_farmaceutico = db.query(Linea).filter(Linea.nombre == "Farmacéutico").first()
        
        # ============ 14 Anaqueles ============
        anaqueles_data = [
            # Cosméticos (5)
            {"nombre": "COS-BASF-1", "linea_id": linea_cosmeticos.id, "proveedor_principal": "BASF"},
            {"nombre": "COS-BASF-2", "linea_id": linea_cosmeticos.id, "proveedor_principal": "BASF"},
            {"nombre": "COS-BASF-3", "linea_id": linea_cosmeticos.id, "proveedor_principal": "BASF"},
            {"nombre": "COS-JRS-1", "linea_id": linea_cosmeticos.id, "proveedor_principal": "JRS"},
            {"nombre": "COS-THOR-1", "linea_id": linea_cosmeticos.id, "proveedor_principal": "THOR"},
            # Industria (3)
            {"nombre": "IND-BASF-1", "linea_id": linea_industrial.id, "proveedor_principal": "BASF"},
            {"nombre": "IND-BASF-THOR", "linea_id": linea_industrial.id, "proveedor_principal": "BASF & THOR"},
            {"nombre": "IND-BULK", "linea_id": linea_industrial.id, "proveedor_principal": "BULK"},
            # Farmacéutica (6)
            {"nombre": "FAR-JRF-1", "linea_id": linea_farmaceutico.id, "proveedor_principal": "JRF"},
            {"nombre": "FAR-JRF-2", "linea_id": linea_farmaceutico.id, "proveedor_principal": "JRF"},
            {"nombre": "FAR-SUD-GIV", "linea_id": linea_farmaceutico.id, "proveedor_principal": "SUDEEP & GIVAUDAN"},
            {"nombre": "FAR-BASF-1", "linea_id": linea_farmaceutico.id, "proveedor_principal": "BASF"},
            {"nombre": "FAR-BASF-2", "linea_id": linea_farmaceutico.id, "proveedor_principal": "BASF"},
            {"nombre": "FAR-MEGGLE-1", "linea_id": linea_farmaceutico.id, "proveedor_principal": "MEGGLE"},
        ]
        
        print("\nInsertando 14 anaqueles...")
        for anaquel_data in anaqueles_data:
            existing = db.query(Anaquel).filter(Anaquel.nombre == anaquel_data["nombre"]).first()
            if not existing:
                anaquel = Anaquel(
                    nombre=anaquel_data["nombre"],
                    descripcion=f"Anaquel {anaquel_data['nombre']} - {anaquel_data['proveedor_principal']}",
                    linea_id=anaquel_data["linea_id"],
                    proveedor_principal=anaquel_data["proveedor_principal"],
                    niveles=10,
                    hileras_por_nivel=13,
                    posiciones_por_hilera=9
                )
                db.add(anaquel)
                print(f"   OK {anaquel_data['nombre']}")
        
        db.commit()
        
        # ============ 1820 Hileras (14 anaqueles x 10 niveles x 13 hileras) ============
        print("\nInsertando hileras (1820 posiciones)...")
        anaqueles = db.query(Anaquel).all()
        hileras_creadas = 0
        
        for anaquel in anaqueles:
            # Verificar si ya existen hileras para este anaquel
            existing_hileras = db.query(Hilera).filter(Hilera.anaquel_id == anaquel.id).count()
            if existing_hileras > 0:
                print(f"   Anaquel {anaquel.nombre}: ya tiene {existing_hileras} hileras, saltando...")
                continue
            
            for nivel in range(1, anaquel.niveles + 1):
                for fila in range(1, anaquel.hileras_por_nivel + 1):
                    # Determinar estado físico según el nivel
                    # Niveles 1-4: líquido, 5-10: sólido
                    estado_fisico = "líquido" if nivel <= 4 else "sólido"
                    
                    hilera = Hilera(
                        anaquel_id=anaquel.id,
                        nivel=nivel,
                        fila=fila,
                        posicion=1,  # Una posición por hilera (simplificado)
                        capacidad_max=9,
                        ancho_min=1,
                        ancho_max=2,
                        fondo_min=1,
                        fondo_max=2,
                        estado_fisico_sugerido=estado_fisico,
                        estado="disponible"
                    )
                    db.add(hilera)
                    hileras_creadas += 1
            
            print(f"   Anaquel {anaquel.nombre}: 130 hileras creadas")
        
        db.commit()
        print(f"   Total hileras en BD: {db.query(Hilera).count()}")
        
        print("\nDatos iniciales insertados correctamente.")
        
        # Mostrar resumen
        print("\nResumen:")
        print(f"   Proveedores: {db.query(Proveedor).count()}")
        print(f"   Clases de Peligro: {db.query(ClasePeligro).count()}")
        print(f"   Líneas: {db.query(Linea).count()}")
        print(f"   Anaqueles: {db.query(Anaquel).count()}")
        print(f"   Hileras: {db.query(Hilera).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_initial_data()