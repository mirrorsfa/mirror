from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.models.account import Account
from backend.app.models.transaction import Transaction
from backend.app.models.user import User
from backend.app.schemas.admin import AdminSummaryRead, AdminUserRead, AdminUserUpdate


class AdminUserNotFoundError(LookupError):
    pass


class AdminSelfProtectionError(ValueError):
    pass


class AdminService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def summary(self) -> AdminSummaryRead:
        return AdminSummaryRead(
            total_users=self.session.scalar(select(func.count()).select_from(User)) or 0,
            active_users=self.session.scalar(
                select(func.count()).select_from(User).where(User.is_active.is_(True))
            ) or 0,
            admin_users=self.session.scalar(
                select(func.count()).select_from(User).where(User.is_admin.is_(True))
            ) or 0,
            total_transactions=self.session.scalar(
                select(func.count()).select_from(Transaction)
            ) or 0,
        )

    def list_users(self) -> list[AdminUserRead]:
        account_counts = dict(self.session.execute(
            select(Account.user_id, func.count(Account.id)).group_by(Account.user_id)
        ).all())
        transaction_counts = dict(self.session.execute(
            select(Transaction.user_id, func.count(Transaction.id)).group_by(Transaction.user_id)
        ).all())
        users = self.session.scalars(select(User).order_by(User.created_at.desc())).all()
        return [
            AdminUserRead(
                id=user.id,
                email=user.email,
                display_name=user.display_name,
                is_active=user.is_active,
                is_admin=user.is_admin,
                created_at=user.created_at,
                account_count=account_counts.get(user.id, 0),
                transaction_count=transaction_counts.get(user.id, 0),
            )
            for user in users
        ]

    def update_user(
        self,
        current_admin_id: str,
        user_id: str,
        payload: AdminUserUpdate,
    ) -> AdminUserRead:
        user = self.session.get(User, user_id)
        if user is None:
            raise AdminUserNotFoundError
        changes = payload.model_dump(exclude_unset=True, exclude_none=True)
        if user_id == current_admin_id and (
            changes.get("is_active") is False or changes.get("is_admin") is False
        ):
            raise AdminSelfProtectionError
        for field, value in changes.items():
            setattr(user, field, value)
        self.session.commit()
        self.session.refresh(user)
        return next(item for item in self.list_users() if item.id == user.id)
