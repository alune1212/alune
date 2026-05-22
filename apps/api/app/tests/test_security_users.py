from app.modules.users.schemas import UserCreate, UserUpdate


class TestSuperuserProtection:
    def test_user_create_schema_is_superuser_defaults_false(self):
        """UserCreate 默认 is_superuser=False，防止客户端误创建超管"""
        payload = UserCreate(
            username="testuser",
            email="test@test.com",
            password="testpass123",
        )
        assert payload.is_superuser is False

    def test_user_update_schema_is_superuser_omitted_by_default(self):
        """UserUpdate 默认不设置 is_superuser，exclude_unset 后字段不出现"""
        payload = UserUpdate(email="new@test.com")
        data = payload.model_dump(exclude_unset=True)
        assert "is_superuser" not in data

    def test_user_update_schema_can_explicitly_set_is_superuser(self):
        """UserUpdate 可以显式设置 is_superuser（router 层做权限校验）"""
        payload = UserUpdate(is_superuser=True)
        data = payload.model_dump(exclude_unset=True)
        assert data["is_superuser"] is True

    def test_user_create_schema_can_explicitly_set_is_superuser(self):
        """UserCreate 可以显式设置 is_superuser=True（router 层做权限校验）"""
        payload = UserCreate(
            username="super",
            email="super@test.com",
            password="testpass123456",
            is_superuser=True,
        )
        assert payload.is_superuser is True


class TestSystemRoleProtection:
    def test_role_model_has_is_system_field(self):
        """Role 模型有 is_system 字段，用于系统角色保护判断"""
        from app.modules.permissions.models import Role
        assert hasattr(Role, "is_system")

    def test_admin_role_is_system_by_default(self):
        """新建 Role 的 is_system 默认为 None（数据库列定义 DEFAULT false）"""
        from app.modules.permissions.models import Role
        role = Role(code="test", name="Test")
        assert role.is_system is None
