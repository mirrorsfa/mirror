from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from backend.app.core.period import period_bounds
from backend.app.models.transaction import Transaction
from backend.app.schemas.transaction import (
    TransactionCreate,
    TransactionType,
    TransactionUpdate,
)


class TransactionRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list(
        self,
        *,
        user_id: str,
        year: int,
        month: int | None = None,
        search: str | None = None,
        transaction_type: TransactionType | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Transaction]:
        if month is None:
            start, end = period_bounds(year, 1)[0], period_bounds(year, 12)[1]
        else:
            start, end = period_bounds(year, month)
        statement: Select[tuple[Transaction]] = (
            select(Transaction)
            .where(
                Transaction.user_id == user_id,
                Transaction.occurred_at >= start,
                Transaction.occurred_at < end,
            )
            .order_by(Transaction.occurred_at.desc(), Transaction.created_at.desc())
        )
        if search:
            pattern = f"%{search.strip().lower()}%"
            statement = statement.where(
                func.lower(Transaction.name).like(pattern)
                | func.lower(Transaction.category).like(pattern)
                | func.lower(Transaction.account).like(pattern)
            )
        if transaction_type:
            statement = statement.where(
                Transaction.transaction_type == transaction_type.value
            )
        return list(self.session.scalars(statement.limit(limit).offset(offset)))

    def get(self, user_id: str, transaction_id: str) -> Transaction | None:
        statement = select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id,
        )
        return self.session.scalar(statement)

    def create(self, user_id: str, payload: TransactionCreate) -> Transaction:
        transaction = Transaction(user_id=user_id, **payload.model_dump(mode="python"))
        transaction.transaction_type = payload.transaction_type.value
        self.session.add(transaction)
        self.session.commit()
        self.session.refresh(transaction)
        return transaction

    def update(
        self, transaction: Transaction, payload: TransactionUpdate
    ) -> Transaction:
        changes = payload.model_dump(exclude_unset=True, exclude_none=True, mode="python")
        if "transaction_type" in changes:
            changes["transaction_type"] = changes["transaction_type"].value
        for field, value in changes.items():
            setattr(transaction, field, value)
        self.session.commit()
        self.session.refresh(transaction)
        return transaction

    def delete(self, transaction: Transaction) -> None:
        self.session.delete(transaction)
        self.session.commit()
