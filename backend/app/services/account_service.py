from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.repositories.account_repository import AccountRepository
from backend.app.schemas.account import AccountCreate, AccountRead, AccountUpdate


class AccountNotFoundError(LookupError):
    pass


class AccountNameExistsError(ValueError):
    pass


class AccountInUseError(ValueError):
    pass


class AccountService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = AccountRepository(session)

    @staticmethod
    def _read(account, transaction_balance: Decimal = Decimal("0")) -> AccountRead:
        return AccountRead(
            **{
                column: getattr(account, column)
                for column in (
                    "id", "name", "account_type", "opening_balance", "currency",
                    "color", "created_at", "updated_at"
                )
            },
            current_balance=account.opening_balance + transaction_balance,
        )

    def list(self, user_id: str) -> list[AccountRead]:
        return [self._read(account, balance) for account, balance in self.repository.list(user_id)]

    def create(self, user_id: str, payload: AccountCreate) -> AccountRead:
        if self.repository.get_by_name(user_id, payload.name):
            raise AccountNameExistsError
        try:
            account = self.repository.create(user_id, payload)
            self.session.commit()
            self.session.refresh(account)
        except IntegrityError as error:
            self.session.rollback()
            raise AccountNameExistsError from error
        return self._read(account)

    def update(self, user_id: str, account_id: str, payload: AccountUpdate) -> AccountRead:
        account = self._get(user_id, account_id)
        if payload.name:
            existing = self.repository.get_by_name(user_id, payload.name)
            if existing and existing.id != account.id:
                raise AccountNameExistsError
        account = self.repository.update(account, payload)
        balances = dict((item.id, balance) for item, balance in self.repository.list(user_id))
        return self._read(account, balances.get(account.id, Decimal("0")))

    def delete(self, user_id: str, account_id: str) -> None:
        account = self._get(user_id, account_id)
        if self.repository.has_transactions(account_id):
            raise AccountInUseError
        self.repository.delete(account)

    def _get(self, user_id: str, account_id: str):
        account = self.repository.get(user_id, account_id)
        if account is None:
            raise AccountNotFoundError
        return account
