from uuid import uuid4

from app.modules.users.schemas import UserBulkStatusUpdate


def test_user_bulk_status_update_accepts_multiple_user_ids() -> None:
    first_user_id = uuid4()
    second_user_id = uuid4()

    payload = UserBulkStatusUpdate(user_ids=[first_user_id, second_user_id], is_active=False)

    assert payload.user_ids == [first_user_id, second_user_id]
    assert payload.is_active is False
