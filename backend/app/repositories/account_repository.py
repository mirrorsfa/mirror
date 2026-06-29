from decimal import Decimal

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from backend.app.models.account import Account
from backend.app.models.transaction import Transaction
from backend.app.schemas.account import AccountCreate, AccountUpdate


class AccountRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list(self, user_id: str) -> list[tuple[Account, Decimal]]:
        signed_amount = case(
            (Transaction.transaction_type == "income", Transaction.amount),
            else_=-Transaction.amount,
        )
        statement = (
            select(Account, func.coalesce(func.sum(signed_amount), 0))
            .outerjoin(Transaction, Transaction.account_id == Account.id)
            .where(Account.user_id == user_id)
            .group_by(Account.id)
            .order_by(Account.created_at)
        )
        return [(account, Decimal(balance)) for account, balance in self.session.execute(statement)]

    def get(self, user_id: str, account_id: str) -> Account | None:
        statement = select(Account).where(
            Account.id == account_id, Account.user_id == user_id
        )
        return self.session.scalar(statement)

    def get_by_name(self, user_id: str, name: str) -> Account | None:
        statement = select(Account).where(
            Account.user_id == user_id, func.lower(Account.name) == name.lower()
        )
        return self.session.scalar(statement)

    def create(self, user_id: str, payload: AccountCreate) -> Account:
        account = Account(
            user_id=user_id,
            **payload.model_dump(mode="python"),
        )
        account.account_type = payload.account_type.value
        self.session.add(account)
        self.session.flush()
        return account

    def update(self, account: Account, payload: AccountUpdate) -> Account:
        changes = payload.model_dump(exclude_unset=True, exclude_none=True, mode="python")
        if "account_type" in changes:
            changes["account_type"] = changes["account_type"].value
        for field, value in changes.items():
            setattr(account, field, value)
        self.session.commit()
        self.session.refresh(account)
        return account

    def delete(self, account: Account) -> None:
        self.session.delete(account)
        self.session.commit()

    def has_transactions(self, account_id: str) -> bool:
        statement = select(func.count()).select_from(Transaction).where(
            Transaction.account_id == account_id
        )
        return bool(self.session.scalar(statement))
