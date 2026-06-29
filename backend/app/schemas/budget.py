from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class BudgetUpsert(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class BudgetRead(BudgetUpsert):
    id: str | None = None
    period: str
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
