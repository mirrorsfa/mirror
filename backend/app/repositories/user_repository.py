from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.models.user import User


class UserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, user_id: str) -> User | None:
        return self.session.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(func.lower(User.email) == email.lower())
        return self.session.scalar(statement)

    def create(self, *, email: str, display_name: str, password_hash: str) -> User:
        user = User(
            email=email.lower(),
            display_name=display_name,
            password_hash=password_hash,
        )
        self.session.add(user)
        self.session.flush()
        return user
