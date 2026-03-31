"""
Router de Movimientos
API endpoints para gestionar movimientos de inventario (entradas, salidas, reubicaciones)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, date

from database.database import get_db
from models.user import User
from models.sample import Sample
from models.movement import Movimiento as MovimientoModel, TipoMovimientoEnum
from models.hilera import Hilera
from schemas import (
    Movimiento as MovimientoSchema, MovimientoCreate, MovimientoUpdate, MovimientoWithRelations,
    RegistroEntradaRequest, RegistroSalidaRequest, RegistroReubicacionRequest
)
from security import get_current_user

router = APIRouter(prefix="/api/movimientos", tags=["Movimientos"])


def check_operator_role(current_user: User):
    """Verifica que el usuario tenga rol de operador o superior"""
    if current_user.role not in ["admin", "supervisor", "operator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción"
        )


@router.get("", response_model=List[MovimientoSchema])
async def get_movimientos(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo de movimiento"),
    sample_id: Optional[int] = Query(None, description="Filtrar por muestra"),
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener lista de movimientos con filtros"""
    query = db.query(MovimientoModel).options(
        joinedload(MovimientoModel.sample),
        joinedload(MovimientoModel.usuario)
    )
    
    if tipo:
        query = query.filter(MovimientoModel.tipo == tipo)
    
    if sample_id:
        query = query.filter(MovimientoModel.sample_id == sample_id)
    
    if fecha_inicio:
        query = query.filter(MovimientoModel.fecha_movimiento >= fecha_inicio)
    
    if fecha_fin:
        query = query.filter(MovimientoModel.fecha_movimiento <= fecha_fin)
    
    return query.order_by(MovimientoModel.fecha_movimiento.desc()).offset(skip).limit(limit).all()


@router.get("/{movimiento_id}", response_model=MovimientoWithRelations)
async def get_movimiento(
    movimiento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener un movimiento por ID"""
    movimiento = db.query(MovimientoModel).options(
        joinedload(MovimientoModel.sample),
        joinedload(MovimientoModel.usuario)
    ).filter(MovimientoModel.id == movimiento_id).first()
    
    if not movimiento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movimiento con ID {movimiento_id} no encontrado"
        )
    
    return movimiento


# ============ REGISTRO DE ENTRADA (CU-01) ============

@router.post("/entrada", response_model=MovimientoSchema, status_code=status.HTTP_201_CREATED)
async def registrar_entrada(
    entrada: RegistroEntradaRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registrar entrada de muestra al inventario (CU-01).
    - Incrementa la cantidad de la muestra
    - Opcionalmente asigna ubicación en hilera
    """
    check_operator_role(current_user)
    
    # Obtener la muestra
    muestra = db.query(Sample).filter(Sample.id == entrada.sample_id).first()
    if not muestra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Muestra con ID {entrada.sample_id} no encontrada"
        )
    
    # Validar que la muestra esté en estado válido para entrada
    if muestra.estado not in ["activa", "inactiva"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede registrar entrada: la muestra está en estado '{muestra.estado}'"
        )
    
    # Actualizar cantidad de la muestra
    nueva_cantidad = Decimal(str(muestra.cantidad_gramos)) + entrada.cantidad_gramos
    muestra.cantidad_gramos = nueva_cantidad
    
    # Si está inactiva, activarla
    if muestra.estado == "inactiva":
        muestra.estado = "activa"
    
    # Si hay hilera destino, actualizar ubicación
    hilera_origen = None
    hilera_destino = None
    if entrada.hilera_destino_id:
        hilera_destino = db.query(Hilera).filter(Hilera.id == entrada.hilera_destino_id).first()
        if hilera_destino:
            # Verificar capacidad
            if hilera_destino.posiciones_usadas >= hilera_destino.capacidad_max:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La hilera destino no tiene capacidad disponible"
                )
            
            # Asignar muestra a la hilera
            hilera_destino.muestra_id = muestra.id
            hilera_destino.estado = "ocupado"
            hilera_destino.posiciones_usadas += 1
            
            # Actualizar ubicación en la muestra
            muestra.anaquel_id = hilera_destino.anaquel_id
            muestra.nivel = hilera_destino.nivel
            muestra.fila = hilera_destino.fila
            muestra.posicion = hilera_destino.posicion
    
    # Crear el registro de movimiento
    movimiento = MovimientoModel(
        sample_id=muestra.id,
        tipo=TipoMovimientoEnum.ENTRADA,
        cantidad_gramos=entrada.cantidad_gramos,
        hilera_destino_id=entrada.hilera_destino_id,
        usuario_id=current_user.id,
        observaciones=entrada.observaciones,
        completado=True
    )
    
    db.add(movimiento)
    db.commit()
    db.refresh(movimiento)
    
    return movimiento


# ============ REGISTRO DE SALIDA (CU-02) ============

@router.post("/salida", response_model=MovimientoSchema, status_code=status.HTTP_201_CREATED)
async def registrar_salida(
    salida: RegistroSalidaRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registrar salida/despacho de muestra (CU-02).
    - Decrementa la cantidad de la muestra
    - Aplica estrategia FEFO automáticamente
    """
    check_operator_role(current_user)
    
    # Obtener la muestra
    muestra = db.query(Sample).filter(Sample.id == salida.sample_id).first()
    if not muestra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Muestra con ID {salida.sample_id} no encontrada"
        )
    
    # Validar que la muestra tenga cantidad suficiente
    cantidad_actual = Decimal(str(muestra.cantidad_gramos))
    if cantidad_actual < salida.cantidad_gramos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cantidad insuficiente. Disponible: {float(cantidad_actual)}g, Solicitado: {float(salida.cantidad_gramos)}g"
        )
    
    # Validar que la muestra esté en estado válido para salida
    if muestra.estado != "activa":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede registrar salida: la muestra está en estado '{muestra.estado}'"
        )
    
    # Decrementar cantidad
    nueva_cantidad = cantidad_actual - salida.cantidad_gramos
    
    if nueva_cantidad <= 0:
        muestra.estado = "agotada"
        muestra.cantidad_gramos = 0
    else:
        muestra.cantidad_gramos = nueva_cantidad
    
    # Crear el registro de movimiento
    movimiento = MovimientoModel(
        sample_id=muestra.id,
        tipo=TipoMovimientoEnum.SALIDA,
        cantidad_gramos=salida.cantidad_gramos,
        hilera_origen_id=muestra.anaquel_id,  # Usar anaquel como referencia
        usuario_id=current_user.id,
        observaciones=salida.observaciones,
        completado=True
    )
    
    db.add(movimiento)
    db.commit()
    db.refresh(movimiento)
    
    return movimiento


# ============ REGISTRO DE REUBICACIÓN ============

@router.post("/reubicacion", response_model=MovimientoSchema, status_code=status.HTTP_201_CREATED)
async def registrar_reubicacion(
    reubicacion: RegistroReubicacionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registrar reubicación de muestra entre hileras.
    """
    check_operator_role(current_user)
    
    # Obtener la muestra
    muestra = db.query(Sample).filter(Sample.id == reubicacion.sample_id).first()
    if not muestra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Muestra con ID {reubicacion.sample_id} no encontrada"
        )
    
    # Obtener hileras origen y destino
    hilera_origen = db.query(Hilera).filter(Hilera.id == reubicacion.hilera_origen_id).first()
    hilera_destino = db.query(Hilera).filter(Hilera.id == reubicacion.hilera_destino_id).first()
    
    if not hilera_origen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hilera origen con ID {reubicacion.hilera_origen_id} no encontrada"
        )
    
    if not hilera_destino:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hilera destino con ID {reubicacion.hilera_destino_id} no encontrada"
        )
    
    # Verificar capacidad de la hilera destino
    if hilera_destino.posiciones_usadas >= hilera_destino.capacidad_max:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La hilera destino no tiene capacidad disponible"
        )
    
    # Actualizar hilera origen
    hilera_origen.muestra_id = None
    hilera_origen.estado = "disponible"
    hilera_origen.posiciones_usadas = max(0, hilera_origen.posiciones_usadas - 1)
    
    # Actualizar hilera destino
    hilera_destino.muestra_id = muestra.id
    hilera_destino.estado = "ocupado"
    hilera_destino.posiciones_usadas += 1
    
    # Actualizar ubicación en la muestra
    muestra.anaquel_id = hilera_destino.anaquel_id
    muestra.nivel = hilera_destino.nivel
    muestra.fila = hilera_destino.fila
    muestra.posicion = hilera_destino.posicion
    
    # Crear el registro de movimiento
    movimiento = MovimientoModel(
        sample_id=muestra.id,
        tipo=TipoMovimientoEnum.REUBICACION,
        cantidad_gramos=muestra.cantidad_gramos,  # No cambia la cantidad
        hilera_origen_id=reubicacion.hilera_origen_id,
        hilera_destino_id=reubicacion.hilera_destino_id,
        usuario_id=current_user.id,
        observaciones=reubicacion.observaciones,
        completado=True
    )
    
    db.add(movimiento)
    db.commit()
    db.refresh(movimiento)
    
    return movimiento


# ============ HISTORIAL DE UNA MUESTRA ============

@router.get("/historial/{sample_id}", response_model=List[MovimientoSchema])
async def get_historial_muestra(
    sample_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener historial de movimientos de una muestra específica"""
    movimientos = db.query(MovimientoModel).filter(
        MovimientoModel.sample_id == sample_id
    ).order_by(MovimientoModel.fecha_movimiento.desc()).all()
    
    return movimientos


# ============ ESTADÍSTICAS ============

@router.get("/stats/resumen", response_model=dict)
async def get_stats_movimientos(
    dias: int = Query(30, ge=1, le=365, description="Días hacia atrás"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener resumen de movimientos en un período"""
    from datetime import timedelta
    
    fecha_inicio = datetime.now() - timedelta(days=dias)
    
    # Contar por tipo
    entradas = db.query(MovimientoModel).filter(
        MovimientoModel.tipo == TipoMovimientoEnum.ENTRADA,
        MovimientoModel.fecha_movimiento >= fecha_inicio
    ).count()
    
    salidas = db.query(MovimientoModel).filter(
        MovimientoModel.tipo == TipoMovimientoEnum.SALIDA,
        MovimientoModel.fecha_movimiento >= fecha_inicio
    ).count()
    
    reubicaciones = db.query(MovimientoModel).filter(
        MovimientoModel.tipo == TipoMovimientoEnum.REUBICACION,
        MovimientoModel.fecha_movimiento >= fecha_inicio
    ).count()
    
    # Total de gramos movimentados
    entrada_gramos = db.query(MovimientoModel).filter(
        MovimientoModel.tipo == TipoMovimientoEnum.ENTRADA,
        MovimientoModel.fecha_movimiento >= fecha_inicio
    ).with_entities(MovimientoModel.cantidad_gramos).all()
    
    salida_gramos = db.query(MovimientoModel).filter(
        MovimientoModel.tipo == TipoMovimientoEnum.SALIDA,
        MovimientoModel.fecha_movimiento >= fecha_inicio
    ).with_entities(MovimientoModel.cantidad_gramos).all()
    
    return {
        "periodo_dias": dias,
        "entradas": entradas,
        "salidas": salidas,
        "reubicaciones": reubicaciones,
        "total_movimientos": entradas + salidas + reubicaciones,
        "gramos_ingresados": float(sum(float(g[0]) for g in entrada_gramos)),
        "gramos_despachados": float(sum(float(g[0]) for g in salida_gramos))
    }