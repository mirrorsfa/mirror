from collections import defaultdict
from decimal import Decimal

from sqlalchemy.orm import Session

from backend.app.core.period import days_in_period, parse_period
from backend.app.repositories.budget_repository import BudgetRepository
from backend.app.repositories.transaction_repository import TransactionRepository
from backend.app.schemas.analytics import (
    CategoryRead,
    SummaryRead,
    TrendPointRead,
    TrendRead,
)


ZERO = Decimal("0.00")
DEFAULT_BUDGET = Decimal("10000.00")


class AnalyticsService:
    def __init__(self, session: Session, user_id: str) -> None:
        self.transactions = TransactionRepository(session)
        self.budgets = BudgetRepository(session)
        self.user_id = user_id

    def _month_transactions(self, period: str):
        year, month = parse_period(period)
        return self.transactions.list(
            user_id=self.user_id, year=year, month=month, limit=10_000
        )

    def summary(self, period: str) -> SummaryRead:
        items = self._month_transactions(period)
        income_items = [item for item in items if item.transaction_type == "income"]
        expense_items = [item for item in items if item.transaction_type == "expense"]
        income = sum((item.amount for item in income_items), ZERO)
        expense = sum((item.amount for item in expense_items), ZERO)
        budget_model = self.budgets.get(self.user_id, period)
        budget = budget_model.amount if budget_model else DEFAULT_BUDGET

        return SummaryRead(
            period=period,
            income=income,
            expense=expense,
            balance=income - expense,
            transaction_count=len(items),
            income_count=len(income_items),
            expense_count=len(expense_items),
            active_days=len({item.occurred_at.date() for item in items}),
            budget=budget,
            budget_remaining=budget - expense,
            budget_percentage=round(float(expense / budget * 100), 2) if budget else 0,
        )

    def categories(self, period: str) -> list[CategoryRead]:
        expenses = [
            item
            for item in self._month_transactions(period)
            if item.transaction_type == "expense"
        ]
        total = sum((item.amount for item in expenses), ZERO)
        grouped: dict[str, dict] = defaultdict(
            lambda: {"amount": ZERO, "color": "#eceeea"}
        )
        for item in expenses:
            grouped[item.category]["amount"] += item.amount
            grouped[item.category]["color"] = item.color

        return [
            CategoryRead(
                category=category,
                amount=data["amount"],
                percentage=round(float(data["amount"] / total * 100), 2)
                if total
                else 0,
                color=data["color"],
            )
            for category, data in sorted(
                grouped.items(), key=lambda item: item[1]["amount"], reverse=True
            )
        ]

    def trend(self, period: str, range_name: str) -> TrendRead:
        year, month = parse_period(period)
        items = self._month_transactions(period)

        if range_name == "month":
            labels = [f"第{week}周" for week in range(1, 6)]
            key_for = lambda date: min((date.day - 1) // 7, 4)
        else:
            day_count = days_in_period(year, month)
            labels = [str(day) for day in range(1, day_count + 1)]
            key_for = lambda date: date.day - 1

        points = [
            {"label": label, "income": ZERO, "expense": ZERO} for label in labels
        ]
        for item in items:
            point = points[key_for(item.occurred_at)]
            point[item.transaction_type] += item.amount

        return TrendRead(
            period=period,
            range=range_name,
            points=[TrendPointRead(**point) for point in points],
        )
