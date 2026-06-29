from typing import Literal

from fastapi import APIRouter, HTTPException

from backend.app.api.dependencies import CurrentUser, DatabaseSession
from backend.app.schemas.analytics import CategoryRead, SummaryRead, TrendRead
from backend.app.services.analytics_service import AnalyticsService


router = APIRouter(prefix="/analytics", tags=["analytics"])


def run_for_period(action):
    try:
        return action()
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.get("/summary", response_model=SummaryRead)
def get_summary(period: str, session: DatabaseSession, user: CurrentUser):
    return run_for_period(lambda: AnalyticsService(session, user.id).summary(period))


@router.get("/categories", response_model=list[CategoryRead])
def get_categories(period: str, session: DatabaseSession, user: CurrentUser):
    return run_for_period(lambda: AnalyticsService(session, user.id).categories(period))


@router.get("/trend", response_model=TrendRead)
def get_trend(
    period: str,
    session: DatabaseSession,
    user: CurrentUser,
    range_name: Literal["day", "month"] = "day",
):
    return run_for_period(
        lambda: AnalyticsService(session, user.id).trend(period, range_name)
    )
