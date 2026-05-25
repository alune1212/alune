import inspect

from app.modules.departments.router import delete_department


def test_delete_department_does_not_parallelize_queries_on_same_session() -> None:
    source = inspect.getsource(delete_department)

    assert "asyncio.gather" not in source
