"""
Modelos de SQLAlchemy para grupos químicos y reglas de compatibilidad.
Versión actualizada para esquema V2.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, Enum, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class ChemicalGroup(Base):
    """Modelo para grupos químicos de clasificación"""
    __tablename__ = 'chemical_groups'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True, comment='Nombre del grupo químico')
    description = Column(Text, nullable=True)
    hazard_level = Column(Enum('none', 'low', 'medium', 'high', 'extreme', name='hazard_level_enum'), 
                        nullable=False, default='none')
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    
    # Relaciones
    compatibility_rules = relationship('ChemicalCompatibilityRule', back_populates='chemical_group', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<ChemicalGroup(name={self.name}, hazard={self.hazard_level})>'


class ChemicalCompatibilityRule(Base):
    """Modelo para reglas de compatibilidad entre grupos químicos"""
    __tablename__ = 'chemical_compatibility_rules'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    chemical_group_id = Column(Integer, ForeignKey('chemical_groups.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    compatible_with_json = Column(JSON, nullable=False, comment='JSON array con IDs de grupos compatibles')
    incompatible_with_json = Column(JSON, nullable=False, comment='JSON array con IDs de grupos incompatibles')
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    
    # Relaciones
    chemical_group = relationship('ChemicalGroup', back_populates='compatibility_rules')
    
    # Índices
    __table_args__ = (
        Index('idx_compatibility_group', 'chemical_group_id'),
    )
    
    def __repr__(self):
        return f'<ChemicalCompatibilityRule(group={self.chemical_group_id})>'


# Alias para compatibilidad con código existente
ChemicalCompatibility = ChemicalCompatibilityRule
