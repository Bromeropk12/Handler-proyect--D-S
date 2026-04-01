"""
Modelo de Matriz de Compatibilidad Química
Almacena las reglas de compatibilidad entre clases de peligro GHS
"""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database.database import Base
import enum


class NivelPeligroEnum(str, enum.Enum):
    """Nivel de peligro para incompatibilidades"""

    BAJO = "bajo"
    MEDIO = "medio"
    ALTO = "alto"
    CRITICO = "critico"


class MatrizCompatibilidad(Base):
    """Modelo de reglas de compatibilidad química entre clases GHS"""

    __tablename__ = "matriz_compatibilidad"

    id = Column(Integer, primary_key=True, index=True)
    clase_a_id = Column(Integer, ForeignKey("clases_peligro.id"), nullable=False)
    clase_b_id = Column(Integer, ForeignKey("clases_peligro.id"), nullable=False)
    compatible = Column(Boolean, nullable=False, default=True)
    nivel_peligro = Column(SQLEnum(NivelPeligroEnum), nullable=True)
    mensaje_advertencia = Column(String(500), nullable=True)

    clase_a = relationship("ClasePeligro", foreign_keys=[clase_a_id])
    clase_b = relationship("ClasePeligro", foreign_keys=[clase_b_id])

    def __repr__(self):
        return f"<MatrizCompatibilidad(clase_a={self.clase_a_id}, clase_b={self.clase_b_id}, compatible={self.compatible})>"
