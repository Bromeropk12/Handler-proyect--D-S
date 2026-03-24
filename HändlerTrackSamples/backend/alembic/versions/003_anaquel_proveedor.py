"""Agregar tabla anaquel_proveedor (RNF-2)

Tabla de relación muchos-a-muchos entre Anaqueles y Proveedores
Permite que un anaquel tenga múltiples proveedores (ej: IND-BASF-THOR mixto)

Revision ID: 003
Revises: 002_add_new_tables
Create Date: 2026-03-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '003_anaquel_proveedor'
down_revision = '002_add_new_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Crear tabla anaquel_proveedor
    op.create_table(
        'anaquel_proveedor',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('anaquel_id', sa.Integer(), nullable=False),
        sa.Column('proveedor_id', sa.Integer(), nullable=False),
        sa.Column('capacidad_max_gramos', sa.Integer(), nullable=True),
        sa.Column('es_principal', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['anaquel_id'], ['anaqueles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['proveedor_id'], ['proveedores.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('anaquel_id', 'proveedor_id', name='uq_anaquel_proveedor')
    )
    
    # Crear índices para mejorar rendimiento
    op.create_index('idx_anaquel_proveedor_anaquel', 'anaquel_proveedor', ['anaquel_id'])
    op.create_index('idx_anaquel_proveedor_proveedor', 'anaquel_proveedor', ['proveedor_id'])
    op.create_index('idx_anaquel_proveedor_activo', 'anaquel_proveedor', ['activo'])


def downgrade() -> None:
    op.drop_index('idx_anaquel_proveedor_activo', table_name='anaquel_proveedor')
    op.drop_index('idx_anaquel_proveedor_proveedor', table_name='anaquel_proveedor')
    op.drop_index('idx_anaquel_proveedor_anaquel', table_name='anaquel_proveedor')
    op.drop_table('anaquel_proveedor')