from app.modules.dictionaries.schemas import DictionaryTypeUpdate
from app.modules.roles.schemas import RoleCreate, RoleUpdate


def test_role_create_and_update_schemas() -> None:
    create_payload = RoleCreate(code="manager", name="Manager", description="Team manager")
    update_payload = RoleUpdate(name="Senior manager")

    assert create_payload.code == "manager"
    assert update_payload.name == "Senior manager"
    assert update_payload.description is None


def test_dictionary_type_update_supports_partial_fields() -> None:
    payload = DictionaryTypeUpdate(name="Employee status", description="Used by HR")

    assert payload.name == "Employee status"
    assert payload.code is None
