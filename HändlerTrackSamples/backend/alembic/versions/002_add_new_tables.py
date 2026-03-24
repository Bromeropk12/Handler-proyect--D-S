"""Add muestras, proveedores, clases_peligro tables

Revision ID: 002_add_new_tables
Revises: 001_initial
Create Date: 2026-03-24

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_new_tables'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create proveedores table
    op.create_table(
        'proveedores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=200), nullable=False),
        sa.Column('nit', sa.String(length=50), nullable=False),
        sa.Column('direccion', sa.String(length=500), nullable=True),
        sa.Column('telefono', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('contacto_nombre', sa.String(length=200), nullable=True),
        sa.Column('contacto_telefono', sa.String(length=50), nullable=True),
        sa.Column('contacto_email', sa.String(length=100), nullable=True),
        sa.Column('activa', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('observaciones', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nit')
    )
    op.create_index(op.f('ix_proveedores_nombre'), 'proveedores', ['nombre'], unique=False)
    op.create_index(op.f('ix_proveedores_nit'), 'proveedores', ['nit'], unique=True)
    op.create_index(op.f('ix_proveedores_email'), 'proveedores', ['email'], unique=False)

    # Create clases_peligro table
    op.create_table(
        'clases_peligro',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('codigo', sa.String(length=10), nullable=False),
        sa.Column('nombre', sa.String(length=200), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('simbolo', sa.String(length=50), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.Column('activa', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('codigo')
    )
    op.create_index(op.f('ix_clases_peligro_codigo'), 'clases_peligro', ['codigo'], unique=True)

    # Create muestras table
    op.create_table(
        'muestras',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=300), nullable=False),
        sa.Column('nombre_alternativo', sa.String(length=300), nullable=True),
        sa.Column('cas_number', sa.String(length=50), nullable=True),
        sa.Column('lote', sa.String(length=50), nullable=True),
        sa.Column('proveedor_id', sa.Integer(), nullable=True),
        sa.Column('linea_negocio', sa.String(length=20), nullable=False),
        sa.Column('clase_peligro_id', sa.Integer(), nullable=True),
        sa.Column('cantidad_gramos', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('dimension', sa.String(length=10), nullable=False, server_default='1x1'),
        sa.Column('fecha_manufactura', sa.DateTime(), nullable=True),
        sa.Column('fecha_vencimiento', sa.DateTime(), nullable=True),
        sa.Column('fecha_ingreso', sa.DateTime(), nullable=True),
        sa.Column('qr_code', sa.String(length=500), nullable=True),
        sa.Column('coa_path', sa.String(length=500), nullable=True),
        sa.Column('hoja_seguridad_path', sa.String(length=500), nullable=True),
        sa.Column('estado', sa.String(length=20), nullable=False, server_default='activa'),
        sa.Column('sample_parent_id', sa.Integer(), nullable=True),
        sa.Column('anaquel_id', sa.Integer(), nullable=True),
        sa.Column('nivel', sa.Integer(), nullable=True),
        sa.Column('fila', sa.Integer(), nullable=True),
        sa.Column('posicion', sa.Integer(), nullable=True),
        sa.Column('observaciones', sa.Text(), nullable=True),
        sa.Column('etiquetas', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['proveedor_id'], ['proveedores.id'], ),
        sa.ForeignKeyConstraint(['clase_peligro_id'], ['clases_peligro.id'], ),
        sa.ForeignKeyConstraint(['sample_parent_id'], ['muestras.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_muestras_nombre'), 'muestras', ['nombre'], unique=False)
    op.create_index(op.f('ix_muestras_cas_number'), 'muestras', ['cas_number'], unique=False)
    op.create_index(op.f('ix_muestras_lote'), 'muestras', ['lote'], unique=False)
    op.create_index(op.f('ix_muestras_proveedor_id'), 'muestras', ['proveedor_id'], unique=False)
    op.create_index(op.f('ix_muestras_clase_peligro_id'), 'muestras', ['clase_peligro_id'], unique=False)
    op.create_index(op.f('ix_muestras_fecha_vencimiento'), 'muestras', ['fecha_vencimiento'], unique=False)
    op.create_index(op.f('ix_muestras_estado'), 'muestras', ['estado'], unique=False)
    op.create_index(op.f('ix_muestras_sample_parent_id'), 'muestras', ['sample_parent_id'], unique=False)
    op.create_index('idx_muestras_nombre_cas', 'muestras', ['nombre', 'cas_number'], unique=False)
    op.create_index('idx_muestras_estado_fecha', 'muestras', ['estado', 'fecha_vencimiento'], unique=False)
    op.create_index('idx_muestras_proveedor_linea', 'muestras', ['proveedor_id', 'linea_negocio'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_muestras_proveedor_linea', table_name='muestras')
    op.drop_index('idx_muestras_estado_fecha', table_name='muestras')
    op.drop_index('idx_muestras_nombre_cas', table_name='muestras')
    op.drop_index(op.f('ix_muestras_sample_parent_id'), table_name='muestras')
    op.drop_index(op.f('ix_muestras_estado'), table_name='muestras')
    op.drop_index(op.f('ix_muestras_fecha_vencimiento'), table_name='muestras')
    op.drop_index(op.f('ix_muestras_clase_peligro_id'), table_name='muestras')
    op.drop_index(op.f('ix_muestras_proveedor_id'), table_name='muestras')
    op.drop_index(op.f('ix_muestras_lote'), table_name='muestras')
    op.drop_index(op.f('ix_muestras_cas_number'), table_name='muestras')
    op.drop_index(op.f('ix_muestras_nombre'), table_name='muestras')
    op.drop_table('muestras')
    op.drop_index(op.f('ix_clases_peligro_codigo'), table_name='clases_peligro')
    op.drop_table('clases_peligro')
    op.drop_index(op.f('ix_proveedores_email'), table_name='proveedores')
    op.drop_index(op.f('ix_proveedores_nit'), table_name='proveedores')
    op.drop_index(op.f('ix_proveedores_nombre'), table_name='proveedores')
    op.drop_table('proveedores')