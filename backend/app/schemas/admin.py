from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator


class AdminSummaryRead(BaseModel):
    total_users: int
    active_users: int
    admin_users: int
    total_transactions: int


class AdminUserRead(BaseModel):
    id: str
    email: EmailStr
    display_name: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    account_count: int
    transaction_count: int


class AdminUserUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=50)
    is_active: bool | None = None
    is_admin: bool | None = None

    @model_validator(mode="after")
    def require_change(self) -> "AdminUserUpdate":
        if not self.model_fields_set:
            raise ValueError("至少需要提供一个待修改字段")
        return self
