"""
Script de Seed - 14 Anaqueles + 1820 Hileras
Distribución exacta según SRS v2.0

Ejecutar: python scripts/seed_14_anaqueles.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from database.database import engine, SessionLocal
from models.linea import Linea
from models.anaquel import Anaquel
from models.hilera import Hilera
from models.proveedor import Proveedor


DISTRIBUCION_14_ANAQUELES = {
    "cosméticos": [
        {
            "nombre": "COS-BASF-01",
            "proveedor": "BASF",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
        {
            "nombre": "COS-BASF-02",
            "proveedor": "BASF",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
        {
            "nombre": "COS-BASF-03",
            "proveedor": "BASF",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
        {
            "nombre": "COS-JRS-01",
            "proveedor": "JRS",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
        {
            "nombre": "COS-THOR-01",
            "proveedor": "THOR",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
    ],
    "industrial": [
        {
            "nombre": "IND-BASF-01",
            "proveedor": "BASF",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
        {
            "nombre": "IND-BASF-THOR-01",
            "proveedor": "BASF/THOR",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
        {
            "nombre": "IND-BULK-01",
            "proveedor": "BULK",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
    ],
    "farmacéutico": [
        {
            "nombre": "FAR-JRF-01",
            "proveedor": "JRF",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
        {
            "nombre": "FAR-JRF-02",
            "proveedor": "JRF",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
        {
            "nombre": "FAR-SUGEIVA-01",
            "proveedor": "SUDEEP/GIVAUDAN",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
        {
            "nombre": "FAR-BASF-01",
            "proveedor": "BASF",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
        {
            "nombre": "FAR-BASF-02",
            "proveedor": "BASF",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
        {
            "nombre": "FAR-MEGGLE-01",
            "proveedor": "MEGGLE",
            "niveles": 10,
            "hileras": 13,
            "posiciones": 9,
        },
    ],
}


def seed_lineas(db: Session) -> dict:
    """Crear líneas de negocio"""
    lineas = {}
    for nombre in ["cosméticos", "industrial", "farmacéutivo"]:
        existing = db.query(Linea).filter(Linea.nombre == nombre).first()
        if not existing:
            linea = Linea(nombre=nombre, descripcion=f"Línea de negocio {nombre}")
            db.add(linea)
            db.commit()
            db.refresh(linea)
            lineas[nombre] = linea
            print(f"  ✓ Línea creada: {nombre}")
        else:
            lineas[nombre] = existing
            print(f"  ✓ Línea existente: {nombre}")
    return lineas


def seed_proveedores(db: Session) -> dict:
    """Crear proveedores necesarios para anaqueles"""
    proveedores_nombres = [
        "BASF",
        "JRS",
        "THOR",
        "BULK",
        "JRF",
        "SUDEEP",
        "GIVAUDAN",
        "MEGGLE",
    ]
    proveedores = {}

    for nombre in proveedores_nombres:
        existing = (
            db.query(Proveedor).filter(Proveedor.nombre.ilike(f"%{nombre}%")).first()
        )
        if existing:
            proveedores[nombre] = existing
            print(f"  ✓ Proveedor existente: {nombre}")
        else:
            proveedor = Proveedor(
                nombre=nombre,
                codigo=nombre,
                activo=True,
                pais="Alemania" if nombre in ["BASF", "THOR"] else "Colombia",
            )
            db.add(proveedor)
            db.commit()
            db.refresh(proveedor)
            proveedores[nombre] = proveedor
            print(f"  ✓ Proveedor creado: {nombre}")

    return proveedores


def seed_anaqueles(db: Session, lineas: dict, proveedores: dict) -> list:
    """Crear los 14 anaqueles"""
    anaqueles = []

    for linea_nombre, anaqueles_config in DISTRIBUCION_14_ANAQUELES.items():
        linea = lineas.get(linea_nombre)
        if not linea:
            print(f"  ✗ Línea no encontrada: {linea_nombre}")
            continue

        for config in anaqueles_config:
            existing = (
                db.query(Anaquel).filter(Anaquel.nombre == config["nombre"]).first()
            )

            if existing:
                anaqueles.append(existing)
                print(f"  ✓ Anaquel existente: {config['nombre']}")
                continue

            anaquel = Anaquel(
                nombre=config["nombre"],
                descripcion=f"Anaquel {config['nombre']} - {linea_nombre}",
                linea_id=linea.id,
                niveles=config["niveles"],
                hileras_por_nivel=config["hileras"],
                posiciones_por_hilera=config["posiciones"],
                proveedor_principal=config["proveedor"],
                activo=True,
                en_mantenimiento=False,
            )
            db.add(anaquel)
            db.commit()
            db.refresh(anaquel)
            anaqueles.append(anaquel)
            print(f"  ✓ Anaquel creado: {config['nombre']}")

    return anaqueles


def seed_hileras(db: Session, anaqueles: list) -> int:
    """Crear las 1820 hileras (14 anaqueles × 10 niveles × 13 hileras)"""
    total_hileras = 0

    for anaquel in anaqueles:
        for nivel in range(1, anaquel.niveles + 1):
            for fila in range(1, anaquel.hileras_por_nivel + 1):
                for posicion in range(1, anaquel.posiciones_por_hilera + 1):
                    existing = (
                        db.query(Hilera)
                        .filter(
                            Hilera.anaquel_id == anaquel.id,
                            Hilera.nivel == nivel,
                            Hilera.fila == fila,
                            Hilera.posicion == posicion,
                        )
                        .first()
                    )

                    if existing:
                        continue

                    estado_fisico = "líquido" if nivel <= 4 else "sólido"

                    hilera = Hilera(
                        anaquel_id=anaquel.id,
                        nivel=nivel,
                        fila=fila,
                        posicion=posicion,
                        capacidad_max=anaquel.posiciones_por_hilera,
                        posiciones_usadas=0,
                        ancho_min=1,
                        ancho_max=2,
                        fondo_min=1,
                        fondo_max=2,
                        estado_fisico_sugerido=estado_fisico,
                        estado="disponible",
                    )
                    db.add(hilera)
                    total_hileras += 1

    if total_hileras > 0:
        db.commit()

    return total_hileras


def verificar_seed(db: Session) -> dict:
    """Verificar que el seed se ejecutó correctamente"""
    total_anaqueles = db.query(Anaquel).count()
    total_hileras = db.query(Hilera).count()
    total_lineas = db.query(Linea).count()

    return {
        "lineas": total_lineas,
        "anaqueles": total_anaqueles,
        "hileras": total_hileras,
        "esperado": {"lineas": 3, "anaqueles": 14, "hileras": 1820},
    }


def main():
    """Ejecutar seed completo"""
    print("\n" + "=" * 60)
    print("SEED: 14 ANAQUELES + 1820 HILERAS")
    print("=" * 60 + "\n")

    db = SessionLocal()

    try:
        print("[1/4] Verificando estado actual...")
        estado = verificar_seed(db)
        print(
            f"  Estado actual: {estado['lineas']} líneas, {estado['anaqueles']} anaqueles, {estado['hileras']} hileras"
        )

        if estado["anaqueles"] >= 14 and estado["hileras"] >= 1820:
            print("\n✓ El seed ya está completo. No se requiere ejecución.")
            return

        print("\n[2/4] Creando líneas de negocio...")
        lineas = seed_lineas(db)

        print("\n[3/4] Creando 14 anaqueles...")
        anaqueles = seed_anaqueles(db, lineas, {})

        print("\n[4/4] Creando hileras...")
        nuevas_hileras = seed_hileras(db, anaqueles)

        print("\n" + "=" * 60)
        print("RESUMEN DEL SEED")
        print("=" * 60)
        estado_final = verificar_seed(db)
        print(
            f"  Líneas: {estado_final['lineas']}/{estado_final['esperado']['lineas']}"
        )
        print(
            f"  Anaqueles: {estado_final['anaqueles']}/{estado_final['esperado']['anaqueles']}"
        )
        print(
            f"  Hileras: {estado_final['hileras']}/{estado_final['esperado']['hileras']}"
        )
        print(f"  Nuevas hileras creadas: {nuevas_hileras}")

        if estado_final["anaqueles"] == 14 and estado_final["hileras"] == 1820:
            print("\n✓ Seed completado exitosamente!")
        else:
            print("\n⚠ Seed parcialmente completado.")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
