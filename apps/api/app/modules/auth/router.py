from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.common.response import ApiResponse
from app.modules.auth.dependencies import DatabaseSession, get_current_user
from app.modules.auth.models import User
from app.modules.auth.repository import authenticate_user
from app.modules.auth.schemas import Token, UserPublic
from app.modules.auth.security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])
LoginForm = Annotated[OAuth2PasswordRequestForm, Depends()]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("/login", response_model=ApiResponse[Token])
async def login(
    form_data: LoginForm,
    session: DatabaseSession,
) -> ApiResponse[Token]:
    user = await authenticate_user(session, form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return ApiResponse(
        success=True,
        data=Token(access_token=create_access_token(subject=user.username)),
    )


@router.get("/me", response_model=ApiResponse[UserPublic])
async def get_me(current_user: CurrentUser) -> ApiResponse[UserPublic]:
    return ApiResponse(success=True, data=UserPublic.model_validate(current_user))
