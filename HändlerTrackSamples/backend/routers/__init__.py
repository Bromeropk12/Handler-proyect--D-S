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
from routers.movements import router as movements_router
from routers.ubicacion import router as ubicacion_router
from routers.dosificacion import router as dosificacion_router
from routers.fefo import router as fefo_router
from routers.alertas import router as alertas_router
from routers.qr import router as qr_router
from routers.reports import router as reports_router
from routers.organizacion import router as organizacion_router
from routers.import_excel import router as import_router
from routers.coa import router as coa_router

__all__ = [
    "proveedores_router",
    "clases_peligro_router",
    "muestras_router",
    "lineas_router",
    "anaqueles_router",
    "hileras_router",
    "anaquel_proveedor_router",
    "movements_router",
    "ubicacion_router",
    "dosificacion_router",
    "fefo_router",
    "alertas_router",
    "qr_router",
    "reports_router",
    "organizacion_router",
    "import_router",
    "coa_router",
]
