"""
Routers API - Händler TrackSamples
"""

from routers.proveedores import router as proveedores_router
from routers.clases_peligro import router as clases_peligro_router
from routers.muestras import router as muestras_router
from routers.lineas import router as lineas_router
from routers.anaqueles import router as anaqueles_router
from routers.hileras import router as hileras_router
from routers.anaquel_proveedor import router as anaquel_proveedor_router

__all__ = [
    "proveedores_router",
    "clases_peligro_router",
    "muestras_router",
    "lineas_router",
    "anaqueles_router",
    "hileras_router",
    "anaquel_proveedor_router",
]