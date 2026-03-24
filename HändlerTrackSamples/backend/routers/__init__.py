"""
Routers API - Händler TrackSamples
"""

from routers.proveedores import router as proveedores_router
from routers.clases_peligro import router as clases_peligro_router
from routers.muestras import router as muestras_router

__all__ = [
    "proveedores_router",
    "clases_peligro_router",
    "muestras_router",
]