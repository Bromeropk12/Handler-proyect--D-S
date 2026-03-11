"""
Modelos de SQLAlchemy para auditoría del sistema.
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class AuditLog(Base):
    """Modelo para el log de auditoría del sistema"""
    __tablename__ = 'audit_log'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, comment='Usuario que realizó la acción')
    action = Column(String(50), nullable=False, comment='Tipo de acción: CREATE, UPDATE, DELETE, LOGIN')
    table_name = Column(String(50), nullable=False, comment='Tabla afectada')
    record_id = Column(Integer, nullable=True, comment='ID del registro afectado')
    old_values = Column(JSON, nullable=True, comment='Valores anteriores')
    new_values = Column(JSON, nullable=True, comment='Valores nuevos')
    ip_address = Column(String(45), nullable=True, comment='Dirección IP del cliente')
    user_agent = Column(String(255), nullable=True, comment='Navegador/dispositivo')
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relaciones
    user = relationship('User', backref='audit_logs')
    
    # Índices
    __table_args__ = (
        Index('idx_audit_user', 'user_id'),
        Index('idx_audit_action', 'action'),
        Index('idx_audit_table', 'table_name'),
        Index('idx_audit_created', 'created_at'),
    )
    
    def __repr__(self):
        return f'<AuditLog(action={self.action}, table={self.table_name}, record={self.record_id})>'
