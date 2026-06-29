from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TransactionType(StrEnum):
    EXPENSE = "expense"
    INCOME = "income"


class TransactionBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    transaction_type: TransactionType
    category: str = Field(min_length=1, max_length=50)
    account: str = Field(min_length=1, max_length=50)
    account_id: str | None = None
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    occurred_at: datetime
    icon: str = Field(default="🧾", max_length=16)
    color: str = Field(default="#eceeea", pattern=r"^#[0-9a-fA-F]{6}$")


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    transaction_type: TransactionType | None = None
    category: str | None = Field(default=None, min_length=1, max_length=50)
    account: str | None = Field(default=None, min_length=1, max_length=50)
    account_id: str | None = None
    amount: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    occurred_at: datetime | None = None
    icon: str | None = Field(default=None, max_length=16)
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")

    @model_validator(mode="after")
    def require_change(self) -> "TransactionUpdate":
        if not self.model_fields_set:
            raise ValueError("至少需要提供一个待修改字段")
        return self


class TransactionRead(TransactionBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
