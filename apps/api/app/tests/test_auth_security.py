import pytest
from jose import JWTError

from app.modules.auth.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)


def test_password_hash_verification() -> None:
    password_hash = get_password_hash("correct-password")

    assert password_hash != "correct-password"
    assert verify_password("correct-password", password_hash)
    assert not verify_password("wrong-password", password_hash)


def test_access_token_contains_subject() -> None:
    token = create_access_token(subject="admin")

    payload = decode_access_token(token)

    assert payload["sub"] == "admin"


def test_invalid_access_token_raises_jwt_error() -> None:
    with pytest.raises(JWTError):
        decode_access_token("not-a-valid-token")
