"""
Modelo de Proveedor
Entidad que representa los proveedores de materias primas
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class Proveedor(Base):
    """Modelo de proveedor de materias primas"""
    __tablename__ = "proveedores"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False, index=True)
    nit = Column(String(50), unique=True, nullable=False, index=True)
    direccion = Column(String(500), nullable=True)
    telefono = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True, index=True)
    contacto_nombre = Column(String(200), nullable=True)
    contacto_telefono = Column(String(50), nullable=True)
    contacto_email = Column(String(100), nullable=True)
    activa = Column(Boolean, nullable=False, default=True)
    observaciones = Column(Text, nullable=True)
    # Líneas de negocio que atiende el proveedor (JSON array: ["cosméticos", "industrial", "farmacéutico"])
    lineas_negocio = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    muestras = relationship("Sample", back_populates="proveedor")
    anaqueles_asociados = relationship("AnaquelProveedor", back_populates="proveedor")
    
    def __repr__(self):
        return f"<Proveedor(nombre='{self.nombre}', nit='{self.nit}')>"