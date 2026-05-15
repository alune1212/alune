from collections.abc import Iterable

from fastapi import HTTPException, status

from app.modules.auth.dependencies import CurrentUser, DatabaseSession
from app.modules.auth.models import User
from app.modules.permissions.repository import list_permission_codes_for_user


def ensure_permission_code(permission_codes: Iterable[str], required_permission: str) -> None:
    if required_permission not in permission_codes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied",
        )


def require_permission(required_permission: str):
    async def dependency(current_user: CurrentUser, session: DatabaseSession) -> User:
        if current_user.is_superuser:
            return current_user
        permission_codes = await list_permission_codes_for_user(session, current_user)
        ensure_permission_code(permission_codes, required_permission)
        return current_user

    return dependency
