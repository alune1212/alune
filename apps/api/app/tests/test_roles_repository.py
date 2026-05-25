from typing import cast
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.permissions.models import Role
from app.modules.roles.repository import replace_role_permissions


class EmptyScalarResult:
    def all(self) -> list[object]:
        return []


class FakeSession:
    def __init__(self) -> None:
        self.execute_count = 0

    async def scalars(self, statement) -> EmptyScalarResult:
        return EmptyScalarResult()

    async def execute(self, *args, **kwargs) -> None:
        self.execute_count += 1


@pytest.mark.asyncio
async def test_replace_role_permissions_does_not_insert_when_permission_list_is_empty() -> None:
    session = FakeSession()
    role = Role(id=uuid4(), code="custom", name="Custom")

    missing_codes = await replace_role_permissions(cast(AsyncSession, session), role, [])

    assert missing_codes == []
    assert session.execute_count == 1
