from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AccountType(StrEnum):
    CASH = "cash"
    BANK = "bank"
    WECHAT = "wechat"
    ALIPAY = "alipay"
    OTHER = "other"


class AccountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    account_type: AccountType
    opening_balance: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    currency: str = Field(default="CNY", min_length=3, max_length=3)
    color: str = Field(default="#2f6658", pattern=r"^#[0-9a-fA-F]{6}$")


class AccountUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    account_type: AccountType | None = None
    opening_balance: Decimal | None = Field(default=None, max_digits=12, decimal_places=2)
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")

    @model_validator(mode="after")
    def require_change(self) -> "AccountUpdate":
        if not self.model_fields_set:
            raise ValueError("至少需要提供一个待修改字段")
        return self


class AccountRead(AccountCreate):
    id: str
    current_balance: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
