from fastapi import APIRouter, HTTPException
from sqlalchemy import inspect, text

from backend.app.api.dependencies import DatabaseSession


router = APIRouter(tags=["system"])


@router.get("/health")
def health_check(session: DatabaseSession) -> dict[str, str]:
    session.execute(text("SELECT 1"))
    inspector = inspect(session.get_bind())
    required_tables = {"transactions", "budgets", "users", "accounts"}
    if not required_tables.issubset(inspector.get_table_names()):
        raise HTTPException(
            status_code=503,
            detail="数据库尚未迁移，请先运行 alembic upgrade head",
        )
    return {
        "status": "ok",
        "service": "today-ledger-api",
        "database": "ready",
    }
