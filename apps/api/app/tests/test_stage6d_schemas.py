from uuid import uuid4

from app.common.pagination import Page
from app.modules.audit.schemas import LoginLogPublic, OperationLogPublic
from app.modules.dictionaries.schemas import DictionaryItemUpdate
from app.modules.users.schemas import UserPasswordUpdate


def test_user_password_update_requires_new_password() -> None:
    payload = UserPasswordUpdate(password="new-password")

    assert payload.password == "new-password"


def test_dictionary_item_update_supports_partial_fields() -> None:
    payload = DictionaryItemUpdate(label="Enabled", is_active=False)

    assert payload.label == "Enabled"
    assert payload.value is None
    assert payload.is_active is False


def test_audit_logs_can_be_wrapped_in_paginated_payload() -> None:
    operation_log = OperationLogPublic(
        id=uuid4(),
        actor_user_id=None,
        action="update",
        resource="user",
        resource_id=None,
        ip_address=None,
        user_agent=None,
        status="success",
        detail=None,
    )
    login_log = LoginLogPublic(
        id=uuid4(),
        username="admin",
        user_id=None,
        ip_address=None,
        user_agent=None,
        status="failure",
        message="Incorrect username or password",
    )

    assert Page[OperationLogPublic](items=[operation_log], page=1, page_size=20, total=1).total == 1
    login_logs = Page[LoginLogPublic](items=[login_log], page=1, page_size=20, total=1)
    assert login_logs.items[0].username == "admin"
