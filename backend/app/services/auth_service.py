from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from backend.app.repositories.account_repository import AccountRepository
from backend.app.repositories.user_repository import UserRepository
from backend.app.schemas.account import AccountCreate, AccountType
from backend.app.schemas.user import TokenRead, UserLogin, UserRead, UserRegister


class EmailAlreadyExistsError(ValueError):
    pass


class InvalidCredentialsError(ValueError):
    pass


DEFAULT_ACCOUNTS = [
    AccountCreate(name="微信支付", account_type=AccountType.WECHAT, color="#63a785"),
    AccountCreate(name="支付宝", account_type=AccountType.ALIPAY, color="#5b9bd5"),
    AccountCreate(name="银行卡", account_type=AccountType.BANK, color="#e6a45d"),
    AccountCreate(name="现金", account_type=AccountType.CASH, color="#8a9b92"),
]


class AuthService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.accounts = AccountRepository(session)

    def register(self, payload: UserRegister) -> TokenRead:
        if self.users.get_by_email(str(payload.email)):
            raise EmailAlreadyExistsError
        try:
            user = self.users.create(
                email=str(payload.email),
                display_name=payload.display_name,
                password_hash=hash_password(payload.password),
            )
            for account in DEFAULT_ACCOUNTS:
                self.accounts.create(user.id, account)
            self.session.commit()
            self.session.refresh(user)
        except IntegrityError as error:
            self.session.rollback()
            raise EmailAlreadyExistsError from error
        return self._token_for(user)

    def login(self, payload: UserLogin) -> TokenRead:
        user = self.users.get_by_email(str(payload.email))
        if user is None or not verify_password(payload.password, user.password_hash):
            raise InvalidCredentialsError
        return self._token_for(user)

    @staticmethod
    def _token_for(user) -> TokenRead:
        return TokenRead(
            access_token=create_access_token(user.id),
            user=UserRead.model_validate(user),
        )
