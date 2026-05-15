from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.modules.auth.models import User
from app.modules.auth.repository import get_user_by_username
from app.modules.auth.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
DatabaseSession = Annotated[AsyncSession, Depends(get_db_session)]
BearerToken = Annotated[str, Depends(oauth2_scheme)]


def credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(token: BearerToken, session: DatabaseSession) -> User:
    try:
        payload = decode_access_token(token)
        username = payload.get("sub")
    except JWTError as exc:
        raise credentials_exception() from exc

    if not isinstance(username, str) or not username:
        raise credentials_exception()

    user = await get_user_by_username(session, username)
    if user is None or not user.is_active:
        raise credentials_exception()

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
