from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm

from app.common.response import ApiResponse
from app.modules.audit.repository import record_login_log
from app.modules.auth.dependencies import CurrentUser, DatabaseSession
from app.modules.auth.repository import authenticate_user
from app.modules.auth.schemas import Token, UserPublic
from app.modules.auth.security import create_access_token
from app.modules.permissions.repository import list_permission_codes_for_user

router = APIRouter(prefix="/auth", tags=["auth"])
LoginForm = Annotated[OAuth2PasswordRequestForm, Depends()]


@router.post("/login", response_model=ApiResponse[Token])
async def login(
    form_data: LoginForm,
    session: DatabaseSession,
    request: Request,
) -> ApiResponse[Token]:
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    user = await authenticate_user(session, form_data.username, form_data.password)
    if user is None:
        await record_login_log(
            session,
            username=form_data.username,
            user_id=None,
            ip_address=ip_address,
            user_agent=user_agent,
            status="failure",
            message="Incorrect username or password",
        )
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    await record_login_log(
        session,
        username=user.username,
        user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent,
        status="success",
    )
    await session.commit()
    return ApiResponse(
        success=True,
        data=Token(access_token=create_access_token(subject=user.username)),
    )


@router.get("/me", response_model=ApiResponse[UserPublic])
async def get_me(current_user: CurrentUser, session: DatabaseSession) -> ApiResponse[UserPublic]:
    user_data = UserPublic.model_validate(current_user)
    user_data.permissions = await list_permission_codes_for_user(session, current_user)
    return ApiResponse(success=True, data=user_data)
