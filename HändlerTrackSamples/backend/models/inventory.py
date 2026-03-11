"""
Modelos de SQLAlchemy para inventario y movimientos de inventario.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, Enum, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class Inventory(Base):
    """Modelo para el inventario en posiciones específicas del anaquel"""
    __tablename__ = 'inventory'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    position_id = Column(Integer, ForeignKey('rack_positions.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False)
    
    # Cantidad
    quantity = Column(Integer, nullable=False, default=0, comment='Cantidad actual')
    unit_id = Column(Integer, ForeignKey('measurement_units.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False)
    unit_count = Column(Integer, nullable=False, default=1, comment='Número de unidades/envases')
    
    # Lote interno
    internal_batch = Column(String(100), nullable=False, unique=True, comment='Lote interno del sistema')
    production_date = Column(Date, nullable=True)
    expiration_date = Column(Date, nullable=True)
    
    # Estado
    status = Column(Enum('available', 'reserved', 'in_quarantine', 'expired', 'disposed', name='inventory_status_enum'), 
                 nullable=False, default='available')
    quarantine_reason = Column(String(255), nullable=True)
    
    # Trazabilidad
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())
    received_from_supplier_date = Column(Date, nullable=True)
    received_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)
    
    # Relaciones
    product = relationship('Product', back_populates='inventory')
    position = relationship('RackPosition', back_populates='inventory')
    unit = relationship('MeasurementUnit')
    receiver = relationship('User', backref='received_inventory')
    movements = relationship('InventoryMovement', back_populates='inventory', cascade='all, delete-orphan')
    
    # Índices y restricciones
    __table_args__ = (
        Index('idx_inventory_product', 'product_id'),
        Index('idx_inventory_position', 'position_id'),
        Index('idx_inventory_status', 'status'),
        Index('idx_inventory_batch', 'internal_batch'),
        Index('idx_inventory_expiration', 'expiration_date'),
    )
    
    def __repr__(self):
        return f'<Inventory(product={self.product_id}, position={self.position_id}, qty={self.quantity})>'


class InventoryMovement(Base):
    """Modelo para el histórico de movimientos de inventario"""
    __tablename__ = 'inventory_movements'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    inventory_id = Column(Integer, ForeignKey('inventory.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False)
    movement_type = Column(Enum('entry', 'exit', 'transfer', 'adjustment', 'disposal', 'quarantine', 'release', name='movement_type_enum'), 
                        nullable=False, comment='Tipo de movimiento')
    
    # Cantidades
    quantity_before = Column(Integer, nullable=False, comment='Cantidad antes del movimiento')
    quantity_after = Column(Integer, nullable=False, comment='Cantidad después del movimiento')
    quantity_moved = Column(Integer, nullable=False, comment='Cantidad movida')
    unit_count_before = Column(Integer, nullable=False)
    unit_count_after = Column(Integer, nullable=False)
    
    # Origen y destino
    from_position_id = Column(Integer, ForeignKey('rack_positions.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)
    to_position_id = Column(Integer, ForeignKey('rack_positions.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)
    
    # Datos del movimiento
    notes = Column(Text, nullable=True)
    reference_document = Column(String(100), nullable=True)
    
    # Usuario
    user_id = Column(Integer, ForeignKey('users.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False)
    movement_date = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relaciones
    inventory = relationship('Inventory', back_populates='movements')
    from_position = relationship('RackPosition', foreign_keys=[from_position_id])
    to_position = relationship('RackPosition', foreign_keys=[to_position_id])
    user = relationship('User', backref='inventory_movements')
    
    # Índices
    __table_args__ = (
        Index('idx_movement_inventory', 'inventory_id'),
        Index('idx_movement_type', 'movement_type'),
        Index('idx_movement_date', 'movement_date'),
        Index('idx_movement_user', 'user_id'),
    )
    
    def __repr__(self):
        return f'<InventoryMovement(type={self.movement_type}, inventory={self.inventory_id})>'
