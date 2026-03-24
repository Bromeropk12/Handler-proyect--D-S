"""
Servicio de Compatibilidad Química
Motor de reglas SGA/GHS para verificar compatibilidad entre muestras
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional, Tuple
from models.clase_peligro import ClasePeligro
from models.sample import Sample
from models.hilera import Hilera


class CompatibilidadService:
    """
    Servicio para verificar compatibilidad química según Sistema Globalmente Armonizado (SGA/GHS).
    
    Implementa la matriz de compatibilidad entre las 9 clases GHS:
    - GHS01: Explosivo
    - GHS02: Inflamable
    - GHS03: Comburente
    - GHS04: Gas a presión
    - GHS05: Corrosivo
    - GHS06: Tóxico
    - GHS07: Irritante
    - GHS08: Peligro para la salud
    - GHS09: Peligros para el medio ambiente
    
    La matriz sigue una configuración triangular:
    - compatible: La combinación es segura
    - incompatible: No se deben almacenar juntos
    - requieren_separacion: Requieren distancia mínima
    """
    
    # Matriz de compatibilidad GHS (triangular superior)
    # Key: (clase_a_codigo, clase_b_codigo), Value: (compatible, nivel_peligro, mensaje)
    MATRIZ_COMPATIBILIDAD = {
        # GHS01 Explosivo - con otros
        ("GHS01", "GHS01"): (False, "critico", "Explosivos juntos - riesgo极高"),
        ("GHS01", "GHS02"): (False, "critico", "Explosivo + Inflamable - Alto riesgo de explosión"),
        ("GHS01", "GHS03"): (False, "critico", "Explosivo + Comburente - Riesgo de detonación"),
        ("GHS01", "GHS04"): (False, "alto", "Explosivo + Gas a presión - Riesgo"),
        ("GHS01", "GHS05"): (False, "alto", "Explosivo + Corrosivo - Reacción violenta"),
        ("GHS01", "GHS06"): (False, "alto", "Explosivo + Tóxico - Peligro"),
        ("GHS01", "GHS07"): (False, "medio", "Explosivo + Irritante - Precaución"),
        ("GHS01", "GHS08"): (False, "alto", "Explosivo + Peligro salud - Riesgo"),
        ("GHS01", "GHS09"): (False, "medio", "Explosivo + Medio ambiente - Precaución"),
        
        # GHS02 Inflamable - con otros
        ("GHS02", "GHS02"): (False, "alto", "Múltiples inflamables - Mayor riesgo"),
        ("GHS02", "GHS03"): (False, "critico", "Inflamable + Comburente - FUEGO"),
        ("GHS02", "GHS04"): (True, "medio", "Inflamable + Gas a presión - Separación recomendada"),
        ("GHS02", "GHS05"): (False, "alto", "Inflamable + Corrosivo - Reacción"),
        ("GHS02", "GHS06"): (False, "alto", "Inflamable + Tóxico - Gas tóxicos"),
        ("GHS02", "GHS07"): (True, "bajo", "Inflamable + Irritante - Compatible"),
        ("GHS02", "GHS08"): (False, "alto", "Inflamable + Peligro salud - Tóxico"),
        ("GHS02", "GHS09"): (True, "medio", "Inflamable + Medio ambiente - Precaución"),
        
        # GHS03 Comburente - con otros
        ("GHS03", "GHS03"): (False, "critico", "Comburentes juntos - FUEGO"),
        ("GHS03", "GHS04"): (False, "alto", "Comburente + Gas a presión - Reacción"),
        ("GHS03", "GHS05"): (False, "alto", "Comburente + Corrosivo - Reacción"),
        ("GHS03", "GHS06"): (False, "critico", "Comburente + Tóxico - Gas mortales"),
        ("GHS03", "GHS07"): (False, "alto", "Comburente + Irritante - Oxidación"),
        ("GHS03", "GHS08"): (False, "critico", "Comburente + Peligro salud - Fatal"),
        ("GHS03", "GHS09"): (False, "alto", "Comburente + Medio ambiente - Daño"),
        
        # GHS04 Gas a presión - con otros
        ("GHS04", "GHS04"): (True, "bajo", "Gases a presión - Separados por tipo"),
        ("GHS04", "GHS05"): (True, "medio", "Gas + Corrosivo - Precaución"),
        ("GHS04", "GHS06"): (True, "medio", "Gas + Tóxico - Ventilación"),
        ("GHS04", "GHS07"): (True, "bajo", "Gas + Irritante - Compatible"),
        ("GHS04", "GHS08"): (True, "medio", "Gas + Peligro salud - Ventilación"),
        ("GHS04", "GHS09"): (True, "bajo", "Gas + Medio ambiente - Compatible"),
        
        # GHS05 Corrosivo - con otros
        ("GHS05", "GHS05"): (True, "medio", "Corrosivos - Separar por tipo"),
        ("GHS05", "GHS06"): (False, "alto", "Corrosivo + Tóxico - Gas mortales"),
        ("GHS05", "GHS07"): (True, "bajo", "Corrosivo + Irritante - Compatible"),
        ("GHS05", "GHS08"): (False, "alto", "Corrosivo + Peligro salud - Daño"),
        ("GHS05", "GHS09"): (True, "medio", "Corrosivo + Medio ambiente - Daño"),
        
        # GHS06 Tóxico - con otros
        ("GHS06", "GHS06"): (False, "critico", "Tóxicos juntos - Mortales"),
        ("GHS06", "GHS07"): (True, "medio", "Tóxico + Irritante - Precaución"),
        ("GHS06", "GHS08"): (False, "alto", "Tóxico + Peligro salud - Fatal"),
        ("GHS06", "GHS09"): (False, "alto", "Tóxico + Medio ambiente - Daño"),
        
        # GHS07 Irritante - con otros
        ("GHS07", "GHS07"): (True, "bajo", "Irritantes - Compatible"),
        ("GHS07", "GHS08"): (True, "medio", "Irritante + Peligro salud - Precaución"),
        ("GHS07", "GHS09"): (True, "bajo", "Irritante + Medio ambiente - Compatible"),
        
        # GHS08 Peligro para la salud - con otros
        ("GHS08", "GHS08"): (True, "medio", "Peligros para salud - Separar carcinógenos"),
        ("GHS08", "GHS09"): (True, "medio", "Peligro salud + Medio ambiente - Precaución"),
        
        # GHS09 Peligro medio ambiente - con otros
        ("GHS09", "GHS09"): (True, "bajo", "Medio ambiente - Compatible"),
    }
    
    @staticmethod
    def verificar_compatibilidad(
        clase_a_codigo: str,
        clase_b_codigo: str
    ) -> Dict[str, Any]:
        """
        Verifica la compatibilidad entre dos clases de peligro.
        
        Args:
            clase_a_codigo: Código GHS de la primera clase
            clase_b_codigo: Código GHS de la segunda clase
            
        Returns:
            Diccionario con resultado de compatibilidad
        """
        # Normalizar códigos (asegurar formato GHS##)
        clase_a = clase_a_codigo.upper()
        clase_b = clase_b_codigo.upper()
        
        # Buscar en la matriz (ambos sentidos)
        clave = (clase_a, clase_b)
        clave_inversa = (clase_b, clase_a)
        
        if clave in CompatibilidadService.MATRIZ_COMPATIBILIDAD:
            compatible, nivel, mensaje = CompatibilidadService.MATRIZ_COMPATIBILIDAD[clave]
        elif clave_inversa in CompatibilidadService.MATRIZ_COMPATIBILIDAD:
            compatible, nivel, mensaje = CompatibilidadService.MATRIZ_COMPATIBILIDAD[clave_inversa]
        else:
            # Si no está en la matriz, asumir compatible (caso no documentado)
            return {
                "compatible": True,
                "nivel": "desconocido",
                "mensaje": f"Combinación {clase_a} + {clase_b} no documentada - Usar precaución",
                "clase_a": clase_a,
                "clase_b": clase_b
            }
        
        return {
            "compatible": compatible,
            "nivel": nivel,
            "mensaje": mensaje,
            "clase_a": clase_a,
            "clase_b": clase_b
        }
    
    @staticmethod
    def get_vecinos(
        db: Session,
        hilera_id: int
    ) -> List[Dict[str, Any]]:
        """
        Obtiene las muestras en hileras vecinas (izquierda/derecha).
        
        Args:
            db: Sesión de base de datos
            hilera_id: ID de la hilera a verificar
            
        Returns:
            Lista de muestras en posiciones vecinas
        """
        hilera = db.query(Hilera).filter(Hilera.id == hilera_id).first()
        
        if not hilera:
            return []
        
        # Obtener hileras en la misma posición (fila y nivel) pero posiciones adyacentes
        # En el modelo actual: posicion 1-9 (profundidad)
        # Vecinos serían: posicion-1 y posicion+1 (si existen)
        posicion = hilera.posicion
        nivel = hilera.nivel
        fila = hilera.fila
        anaquel_id = hilera.anaquel_id
        
        vecinos = []
        
        # Posiciones vecinas (izquierda y derecha en profundidad)
        for pos_vecina in [posicion - 1, posicion + 1]:
            if pos_vecina < 1 or pos_vecina > 9:
                continue
            
            hilera_vecina = db.query(Hilera).filter(
                Hilera.anaquel_id == anaquel_id,
                Hilera.nivel == nivel,
                Hilera.fila == fila,
                Hilera.posicion == pos_vecina,
                Hilera.muestra_id.isnot(None)
            ).first()
            
            if hilera_vecina and hilera_vecina.muestra:
                muestra = hilera_vecina.muestra
                clase_codigo = muestra.clase_peligro.codigo if muestra.clase_peligro else None
                
                vecinos.append({
                    "hilera_id": hilera_vecina.id,
                    "muestra_id": muestra.id,
                    "nombre": muestra.nombre,
                    "clase_peligro": clase_codigo,
                    "posicion": pos_vecina
                })
        
        return vecinos
    
    @staticmethod
    def es_seguro_asignar(
        db: Session,
        muestra_id: int,
        hilera_id: int
    ) -> Dict[str, Any]:
        """
        Verifica si es seguro asignar una muestra a una hilera.
        
        Args:
            db: Sesión de base de datos
            muestra_id: ID de la muestra a asignar
            hilera_id: ID de la hilera destino
            
        Returns:
            Diccionario con resultado de seguridad
        """
        # Obtener la muestra
        muestra = db.query(Sample).filter(Sample.id == muestra_id).first()
        if not muestra:
            return {
                "seguro": False,
                "error": "Muestra no encontrada"
            }
        
        # Si la muestra no tiene clase de peligro, es segura
        if not muestra.clase_peligro_id or not muestra.clase_peligro:
            return {
                "seguro": True,
                "mensaje": "Muestra sin clase de peligro asignada - Seguro"
            }
        
        clase_muestra = muestra.clase_peligro.codigo
        
        # Obtener vecinos en la hilera destino
        vecinos = CompatibilidadService.get_vecinos(db, hilera_id)
        
        if not vecinos:
            return {
                "seguro": True,
                "mensaje": "No hay muestras en posiciones vecinas"
            }
        
        # Verificar compatibilidad con cada vecino
        incompatibilidades = []
        
        for vecino in vecinos:
            if not vecino.get("clase_peligro"):
                continue
            
            resultado = CompatibilidadService.verificar_compatibilidad(
                clase_muestra,
                vecino["clase_peligro"]
            )
            
            if not resultado["compatible"]:
                incompatibilidades.append({
                    "vecino": {
                        "nombre": vecino["nombre"],
                        "clase": vecino["clase_peligro"]
                    },
                    "nivel": resultado["nivel"],
                    "mensaje": resultado["mensaje"]
                })
        
        if incompatibilidades:
            return {
                "seguro": False,
                "mensaje": "Incompatibilidad con muestras vecinas",
                "incompatibilidades": incompatibilidades
            }
        
        return {
            "seguro": True,
            "mensaje": "Compatible con todas las muestras vecinas"
        }
    
    @staticmethod
    def get_matriz_completa(
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        Obtiene la matriz completa de compatibilidad.
        
        Args:
            db: Sesión de base de datos
            
        Returns:
            Lista con todas las combinaciones de compatibilidad
        """
        # Obtener todas las clases de peligro
        clases = db.query(ClasePeligro).all()
        
        matriz = []
        clases_codigos = [c.codigo for c in clases]
        
        # Generar todas las combinaciones únicas (triangular superior)
        for i, clase_a in enumerate(clases_codigos):
            for clase_b in clases_codigos[i:]:
                resultado = CompatibilidadService.verificar_compatibilidad(clase_a, clase_b)
                matriz.append({
                    "clase_a": clase_a,
                    "clase_b": clase_b,
                    "compatible": resultado["compatible"],
                    "nivel": resultado["nivel"],
                    "mensaje": resultado["mensaje"]
                })
        
        return matriz
    
    @staticmethod
    def get_clases_incompatibles(
        clase_codigo: str
    ) -> List[str]:
        """
        Obtiene las clases incompatibles con una clase dada.
        
        Args:
            clase_codigo: Código GHS de la clase
            
        Returns:
            Lista de códigos de clases incompatibles
        """
        clase = clase_codigo.upper()
        incompatibles = []
        
        for (a, b), (compatible, _, _) in CompatibilidadService.MATRIZ_COMPATIBILIDAD.items():
            if not compatible:
                if a == clase:
                    incompatibles.append(b)
                elif b == clase:
                    incompatibles.append(a)
        
        return list(set(incompatibles))