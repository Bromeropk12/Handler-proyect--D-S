"""Baseline - Current production schema

Revision ID: 004_baseline_production
Revises: 003_anaquel_proveedor
Create Date: 2026-04-02 13:48:44.199575

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004_baseline_production'
down_revision: Union[str, None] = '003_anaquel_proveedor'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
