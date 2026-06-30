from fastapi import APIRouter, HTTPException

from backend.app.api.dependencies import AdminUser, DatabaseSession
from backend.app.schemas.admin import AdminSummaryRead, AdminUserRead, AdminUserUpdate
from backend.app.services.admin_service import (
    AdminSelfProtectionError,
    AdminService,
    AdminUserNotFoundError,
)


router = APIRouter(prefix="/admin", tags=["administration"])


@router.get("/summary", response_model=AdminSummaryRead)
def admin_summary(session: DatabaseSession, _: AdminUser):
    return AdminService(session).summary()


@router.get("/users", response_model=list[AdminUserRead])
def list_users(session: DatabaseSession, _: AdminUser):
    return AdminService(session).list_users()


@router.patch("/users/{user_id}", response_model=AdminUserRead)
def update_user(
    user_id: str,
    payload: AdminUserUpdate,
    session: DatabaseSession,
    admin: AdminUser,
):
    try:
        return AdminService(session).update_user(admin.id, user_id, payload)
    except AdminUserNotFoundError as error:
        raise HTTPException(status_code=404, detail="用户不存在") from error
    except AdminSelfProtectionError as error:
        raise HTTPException(status_code=409, detail="不能停用自己或移除自己的管理员权限") from error
