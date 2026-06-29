from fastapi import APIRouter, HTTPException, Response, status

from backend.app.api.dependencies import CurrentUser, DatabaseSession
from backend.app.schemas.account import AccountCreate, AccountRead, AccountUpdate
from backend.app.services.account_service import (
    AccountInUseError,
    AccountNameExistsError,
    AccountNotFoundError,
    AccountService,
)


router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountRead])
def list_accounts(session: DatabaseSession, user: CurrentUser):
    return AccountService(session).list(user.id)


@router.post("", response_model=AccountRead, status_code=status.HTTP_201_CREATED)
def create_account(payload: AccountCreate, session: DatabaseSession, user: CurrentUser):
    try:
        return AccountService(session).create(user.id, payload)
    except AccountNameExistsError as error:
        raise HTTPException(status_code=409, detail="账户名称已经存在") from error


@router.patch("/{account_id}", response_model=AccountRead)
def update_account(
    account_id: str,
    payload: AccountUpdate,
    session: DatabaseSession,
    user: CurrentUser,
):
    try:
        return AccountService(session).update(user.id, account_id, payload)
    except AccountNotFoundError as error:
        raise HTTPException(status_code=404, detail="账户不存在") from error
    except AccountNameExistsError as error:
        raise HTTPException(status_code=409, detail="账户名称已经存在") from error


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: str, session: DatabaseSession, user: CurrentUser
) -> Response:
    try:
        AccountService(session).delete(user.id, account_id)
    except AccountNotFoundError as error:
        raise HTTPException(status_code=404, detail="账户不存在") from error
    except AccountInUseError as error:
        raise HTTPException(status_code=409, detail="账户已有流水，不能删除") from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
