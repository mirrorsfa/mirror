from fastapi import APIRouter, HTTPException

from backend.app.api.dependencies import CurrentUser, DatabaseSession
from backend.app.core.period import parse_period
from backend.app.repositories.budget_repository import BudgetRepository
from backend.app.schemas.budget import BudgetRead, BudgetUpsert
from backend.app.services.analytics_service import DEFAULT_BUDGET


router = APIRouter(prefix="/budgets", tags=["budgets"])


def validate_period(period: str) -> None:
    try:
        parse_period(period)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.get("/{period}", response_model=BudgetRead)
def get_budget(period: str, session: DatabaseSession, user: CurrentUser):
    validate_period(period)
    budget = BudgetRepository(session).get(user.id, period)
    if budget:
        return budget
    return BudgetRead(period=period, amount=DEFAULT_BUDGET, updated_at=None)


@router.put("/{period}", response_model=BudgetRead)
def upsert_budget(
    period: str, payload: BudgetUpsert, session: DatabaseSession, user: CurrentUser
):
    validate_period(period)
    return BudgetRepository(session).upsert(user.id, period, payload.amount)
