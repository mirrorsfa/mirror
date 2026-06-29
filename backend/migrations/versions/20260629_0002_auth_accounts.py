"""添加用户鉴权、账户和数据归属。

Revision ID: 20260629_0002
Revises: 20260629_0001
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260629_0002"
down_revision: str | None = "20260629_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=50), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_table(
        "accounts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("account_type", sa.String(length=20), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("opening_balance", sa.Numeric(12, 2), nullable=False),
        sa.Column("color", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "name", name="uq_account_user_name"),
    )
    op.create_index("ix_accounts_user_id", "accounts", ["user_id"])

    with op.batch_alter_table("transactions") as batch:
        batch.add_column(sa.Column("user_id", sa.String(length=36), nullable=True))
        batch.add_column(sa.Column("account_id", sa.String(length=36), nullable=True))
        batch.create_foreign_key(
            "fk_transactions_user_id", "users", ["user_id"], ["id"], ondelete="CASCADE"
        )
        batch.create_foreign_key(
            "fk_transactions_account_id",
            "accounts",
            ["account_id"],
            ["id"],
            ondelete="SET NULL",
        )
        batch.create_index("ix_transactions_user_id", ["user_id"])
        batch.create_index("ix_transactions_account_id", ["account_id"])

    op.rename_table("budgets", "budgets_legacy")
    op.create_table(
        "budgets",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("period", sa.String(length=7), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "period", name="uq_budget_user_period"),
    )
    op.create_index("ix_budgets_period", "budgets", ["period"])
    op.create_index("ix_budgets_user_id", "budgets", ["user_id"])
    op.execute(
        "INSERT INTO budgets (id, user_id, period, amount, updated_at) "
        "SELECT 'legacy-' || period, NULL, period, amount, updated_at FROM budgets_legacy"
    )
    op.drop_table("budgets_legacy")


def downgrade() -> None:
    op.rename_table("budgets", "budgets_new")
    op.create_table(
        "budgets",
        sa.Column("period", sa.String(length=7), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("period"),
    )
    op.execute(
        "INSERT OR IGNORE INTO budgets (period, amount, updated_at) "
        "SELECT period, amount, updated_at FROM budgets_new"
    )
    op.drop_table("budgets_new")

    with op.batch_alter_table("transactions") as batch:
        batch.drop_index("ix_transactions_account_id")
        batch.drop_index("ix_transactions_user_id")
        batch.drop_constraint("fk_transactions_account_id", type_="foreignkey")
        batch.drop_constraint("fk_transactions_user_id", type_="foreignkey")
        batch.drop_column("account_id")
        batch.drop_column("user_id")

    op.drop_index("ix_accounts_user_id", table_name="accounts")
    op.drop_table("accounts")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
