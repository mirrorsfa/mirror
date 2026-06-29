from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.budget import Budget


class BudgetRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, user_id: str, period: str) -> Budget | None:
        statement = select(Budget).where(
            Budget.user_id == user_id, Budget.period == period
        )
        return self.session.scalar(statement)

    def upsert(self, user_id: str, period: str, amount: Decimal) -> Budget:
        budget = self.get(user_id, period)
        if budget is None:
            budget = Budget(user_id=user_id, period=period, amount=amount)
            self.session.add(budget)
        else:
            budget.amount = amount
        self.session.commit()
        self.session.refresh(budget)
        return budget
