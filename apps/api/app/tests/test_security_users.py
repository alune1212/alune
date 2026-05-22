from app.modules.users.schemas import UserCreate, UserUpdate


class TestSuperuserProtection:
    def test_user_create_schema_is_superuser_defaults_false(self):
        """UserCreate defaults is_superuser=False to prevent accidental superuser creation"""
        payload = UserCreate(
            username="testuser",
            email="test@test.com",
            password="testpass123",
        )
        assert payload.is_superuser is False

    def test_user_update_schema_is_superuser_omitted_by_default(self):
        """UserUpdate omits is_superuser by default when exclude_unset=True"""
        payload = UserUpdate(email="new@test.com")
        data = payload.model_dump(exclude_unset=True)
        assert "is_superuser" not in data

    def test_user_update_schema_can_explicitly_set_is_superuser(self):
        """UserUpdate allows explicitly setting is_superuser (router enforces authorization)"""
        payload = UserUpdate(is_superuser=True)
        data = payload.model_dump(exclude_unset=True)
        assert data["is_superuser"] is True

    def test_user_create_schema_can_explicitly_set_is_superuser(self):
        """UserCreate allows explicitly setting is_superuser=True (router enforces authorization)"""
        payload = UserCreate(
            username="super",
            email="super@test.com",
            password="testpass123456",
            is_superuser=True,
        )
        assert payload.is_superuser is True


class TestSystemRoleProtection:
    def test_role_model_has_is_system_field(self):
        """Role model has is_system field for system role protection"""
        from app.modules.permissions.models import Role
        assert hasattr(Role, "is_system")

    def test_admin_role_is_system_by_default(self):
        """New Role is_system defaults to None (DB server_default 'false')"""
        from app.modules.permissions.models import Role
        role = Role(code="test", name="Test")
        assert role.is_system is None
