"""Initial migration - Create all tables

Revision ID: 001_initial
Revises: 
Create Date: 2026-03-10

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='user'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Create samples table
    op.create_table(
        'samples',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('reference_code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('chemical_composition', sa.Text(), nullable=True),
        sa.Column('supplier', sa.String(length=100), nullable=True),
        sa.Column('batch_number', sa.String(length=50), nullable=True),
        sa.Column('quantity', sa.Float(), nullable=False, server_default='0'),
        sa.Column('unit', sa.String(length=20), nullable=False, server_default='kg'),
        sa.Column('coa_path', sa.String(length=255), nullable=True),
        sa.Column('business_line', sa.String(length=50), nullable=True),
        sa.Column('zone', sa.String(length=10), nullable=True),
        sa.Column('level', sa.String(length=5), nullable=True),
        sa.Column('position', sa.String(length=5), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='available'),
        sa.Column('is_compatible', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reference_code')
    )
    op.create_index(op.f('ix_samples_reference_code'), 'samples', ['reference_code'], unique=True)
    op.create_index(op.f('ix_samples_status'), 'samples', ['status'], unique=False)
    op.create_index(op.f('ix_samples_business_line'), 'samples', ['business_line'], unique=False)

    # Create movements table
    op.create_table(
        'movements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sample_id', sa.Integer(), nullable=False),
        sa.Column('movement_type', sa.String(length=20), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=False),
        sa.Column('source_location', sa.String(length=50), nullable=True),
        sa.Column('destination_location', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['sample_id'], ['samples.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_movements_sample_id'), 'movements', ['sample_id'], unique=False)
    op.create_index(op.f('ix_movements_created_at'), 'movements', ['created_at'], unique=False)

    # Create chemical_compatibility table
    op.create_table(
        'chemical_compatibility',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('chemical_group', sa.String(length=100), nullable=False),
        sa.Column('compatible_with', sa.Text(), nullable=True),
        sa.Column('incompatible_with', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('chemical_group')
    )
    op.create_index(op.f('ix_chemical_compatibility_chemical_group'), 'chemical_compatibility', ['chemical_group'], unique=True)


def downgrade() -> None:
    op.drop_table('chemical_compatibility')
    op.drop_table('movements')
    op.drop_table('samples')
    op.drop_table('users')
