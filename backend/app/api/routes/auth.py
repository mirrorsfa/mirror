from fastapi import APIRouter, HTTPException, status

from backend.app.api.dependencies import CurrentUser, DatabaseSession
from backend.app.schemas.user import TokenRead, UserLogin, UserRead, UserRegister
from backend.app.services.auth_service import (
    AuthService,
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    UserDisabledError,
)


router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=TokenRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, session: DatabaseSession):
    try:
        return AuthService(session).register(payload)
    except EmailAlreadyExistsError as error:
        raise HTTPException(status_code=409, detail="该邮箱已经注册") from error


@router.post("/login", response_model=TokenRead)
def login(payload: UserLogin, session: DatabaseSession):
    try:
        return AuthService(session).login(payload)
    except InvalidCredentialsError as error:
        raise HTTPException(status_code=401, detail="邮箱或密码不正确") from error
    except UserDisabledError as error:
        raise HTTPException(status_code=403, detail="账号已被管理员停用") from error


@router.get("/me", response_model=UserRead)
def current_user(user: CurrentUser):
    return user
