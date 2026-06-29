from sqlalchemy.orm import Session

from backend.app.models.transaction import Transaction
from backend.app.repositories.transaction_repository import TransactionRepository
from backend.app.repositories.account_repository import AccountRepository
from backend.app.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionNotFoundError(LookupError):
    pass


class TransactionAccountNotFoundError(ValueError):
    pass


class TransactionService:
    def __init__(self, session: Session) -> None:
        self.repository = TransactionRepository(session)
        self.accounts = AccountRepository(session)

    def create(self, user_id: str, payload: TransactionCreate) -> Transaction:
        payload = self._with_verified_account(user_id, payload)
        return self.repository.create(user_id, payload)

    def update(
        self, user_id: str, transaction_id: str, payload: TransactionUpdate
    ) -> Transaction:
        transaction = self.get(user_id, transaction_id)
        if payload.account_id:
            account = self.accounts.get(user_id, payload.account_id)
            if account is None:
                raise TransactionAccountNotFoundError
            payload = payload.model_copy(update={"account": account.name})
        return self.repository.update(transaction, payload)

    def delete(self, user_id: str, transaction_id: str) -> None:
        transaction = self.get(user_id, transaction_id)
        self.repository.delete(transaction)

    def get(self, user_id: str, transaction_id: str) -> Transaction:
        transaction = self.repository.get(user_id, transaction_id)
        if transaction is None:
            raise TransactionNotFoundError(transaction_id)
        return transaction

    def _with_verified_account(
        self, user_id: str, payload: TransactionCreate
    ) -> TransactionCreate:
        if not payload.account_id:
            return payload
        account = self.accounts.get(user_id, payload.account_id)
        if account is None:
            raise TransactionAccountNotFoundError
        return payload.model_copy(update={"account": account.name})
