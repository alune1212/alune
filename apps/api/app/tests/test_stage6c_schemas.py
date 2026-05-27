from uuid import uuid4

from app.common.pagination import Page
from app.modules.departments.schemas import DepartmentTreeNode
from app.modules.files.schemas import StoredUpload
from app.modules.users.schemas import UserRolePublic, UserRoleUpdate


def test_page_schema_exposes_items_and_meta() -> None:
    page = Page[str](items=["admin"], page=1, page_size=20, total=1)

    assert page.items == ["admin"]
    assert page.page == 1
    assert page.page_size == 20
    assert page.total == 1


def test_user_role_schemas_use_role_codes() -> None:
    user_id = uuid4()
    public = UserRolePublic(user_id=user_id, role_codes=["admin"])
    payload = UserRoleUpdate(role_codes=["admin", "manager"])

    assert public.user_id == user_id
    assert payload.role_codes == ["admin", "manager"]


def test_department_tree_node_supports_nested_children() -> None:
    root_id = uuid4()
    child_id = uuid4()
    tree = DepartmentTreeNode(
        id=root_id,
        code="HQ",
        name="默认空间",
        parent_id=None,
        description=None,
        sort_order=0,
        is_active=True,
        children=[
            DepartmentTreeNode(
                id=child_id,
                code="HR",
                name="协作空间",
                parent_id=root_id,
                description=None,
                sort_order=1,
                is_active=True,
                children=[],
            )
        ],
    )

    assert tree.children[0].parent_id == root_id


def test_stored_upload_describes_safe_storage_result() -> None:
    upload = StoredUpload(
        filename="example.txt",
        original_filename="Example.txt",
        content_type="text/plain",
        size_bytes=12,
        storage_path="2026/05/example.txt",
        checksum="abc123",
    )

    assert upload.storage_path.endswith("example.txt")
