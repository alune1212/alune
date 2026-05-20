import { afterEach, describe, expect, it, vi } from "vitest";

import {
  configureApiClient,
  fetchCurrentUser,
  fetchDepartments,
  fetchDepartmentTree,
  fetchDictionaryItems,
  fetchDictionaryTypes,
  fetchFileAttachments,
  fetchLoginLogs,
  fetchOperationLogs,
  fetchRoles,
  fetchUsers,
  loginWithPassword,
  exportLoginLogs,
  exportOperationLogs,
  createUser,
  updateUsersStatus,
  updateUserRoles,
  createRole,
  updateRolePermissions,
  createDepartment,
  deleteDepartment,
  createDictionaryType,
  updateDictionaryItem,
  createFileAttachment,
  uploadFileAttachment,
  downloadFileAttachment
} from "./index";
import { healthCheckApiV1HealthGet } from "./generated/api";

describe("generated API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    configureApiClient({});
  });

  it("uses the configured API base URL for generated requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { status: "ok", service: "api" },
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    const response = await healthCheckApiV1HealthGet();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/health", {
      method: "GET"
    });
    expect(response.data.data.status).toBe("ok");
  });

  it("uses the runtime configured API base URL", async () => {
    configureApiClient({ baseUrl: "http://localhost:18000/" });

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { status: "ok", service: "api" },
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    await healthCheckApiV1HealthGet();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:18000/api/v1/health", {
      method: "GET"
    });
  });

  it("sends login requests through the generated form-urlencoded auth client", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { access_token: "token-value", token_type: "bearer" },
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    const response = await loginWithPassword({ username: "admin", password: "secret" });

    const [, options] = fetchMock.mock.calls[0]!;
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:8000/api/v1/auth/login");
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({ "Content-Type": "application/x-www-form-urlencoded" });
    expect(options?.body).toBeInstanceOf(URLSearchParams);
    expect((options?.body as URLSearchParams).get("username")).toBe("admin");
    expect((options?.body as URLSearchParams).get("password")).toBe("secret");
    expect(response.data.access_token).toBe("token-value");
  });

  it("sends current-user requests with a bearer token through the generated auth client", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: "user-1",
            username: "admin",
            email: "admin@example.com",
            full_name: null,
            department_id: null,
            is_active: true,
            is_superuser: true,
            permissions: ["menu:dashboard"]
          },
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    const response = await fetchCurrentUser("token-value");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/auth/me", {
      method: "GET",
      headers: {
        Authorization: "Bearer token-value"
      }
    });
    expect(response.data.username).toBe("admin");
  });

  it("sends user list filters through the generated users client", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { items: [], page: 2, page_size: 20, total: 0 },
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    const response = await fetchUsers("token-value", {
      q: "alice",
      departmentId: "dept-1",
      roleCode: "admin",
      page: 2,
      pageSize: 20
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/users?q=alice&department_id=dept-1&role_code=admin&page=2&page_size=20",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer token-value"
        }
      }
    );
    expect(response.data.page).toBe(2);
  });

  it("sends role list requests through the generated roles client", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [],
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    const response = await fetchRoles("token-value");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/roles", {
      method: "GET",
      headers: {
        Authorization: "Bearer token-value"
      }
    });
    expect(response.data).toEqual([]);
  });

  it("sends department list filters through the generated departments client", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { items: [], page: 1, page_size: 100, total: 0 },
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    const response = await fetchDepartments("token-value", {
      q: "sales",
      page: 1,
      pageSize: 100
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/departments?q=sales&page=1&page_size=100",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer token-value"
        }
      }
    );
    expect(response.data.page_size).toBe(100);
  });

  it("sends department tree requests through the generated departments client", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [],
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    const response = await fetchDepartmentTree("token-value");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/departments/tree", {
      method: "GET",
      headers: {
        Authorization: "Bearer token-value"
      }
    });
    expect(response.data).toEqual([]);
  });

  it("sends operation log filters through the generated audit client", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { items: [], page: 3, page_size: 15, total: 0 },
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    const response = await fetchOperationLogs("token-value", {
      q: "login",
      status: "success",
      startedAt: "2026-01-01T00:00:00",
      endedAt: "2026-01-31T23:59:59",
      page: 3,
      pageSize: 15
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/audit/operation-logs?q=login&started_at=2026-01-01T00%3A00%3A00&ended_at=2026-01-31T23%3A59%3A59&page=3&page_size=15&status=success",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer token-value"
        }
      }
    );
    expect(response.data.page).toBe(3);
  });

  it("sends login log filters through the generated audit client", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { items: [], page: 1, page_size: 10, total: 0 },
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    const response = await fetchLoginLogs("token-value", {
      q: "admin",
      status: "failure",
      page: 1,
      pageSize: 10
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/audit/login-logs?q=admin&page=1&page_size=10&status=failure",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer token-value"
        }
      }
    );
    expect(response.data.total).toBe(0);
  });

  it("sends dictionary type requests through the generated dictionary client", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [],
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    const response = await fetchDictionaryTypes("token-value");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/dictionaries/types", {
      method: "GET",
      headers: {
        Authorization: "Bearer token-value"
      }
    });
    expect(response.data).toEqual([]);
  });

  it("sends dictionary item requests through the generated dictionary client", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [],
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    const response = await fetchDictionaryItems("token-value");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/dictionaries/items", {
      method: "GET",
      headers: {
        Authorization: "Bearer token-value"
      }
    });
    expect(response.data).toEqual([]);
  });

  it("sends file attachment filters through the generated files client", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { items: [], page: 4, page_size: 25, total: 0 },
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    const response = await fetchFileAttachments("token-value", {
      q: "contract",
      page: 4,
      pageSize: 25
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/files?q=contract&page=4&page_size=25", {
      method: "GET",
      headers: {
        Authorization: "Bearer token-value"
      }
    });
    expect(response.data.page).toBe(4);
  });

  it("sends user write requests as generated JSON requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { id: "user-1", username: "alice", email: "alice@example.com" },
          message: "OK",
          error: null
        }),
        { status: 201 }
      )
    );

    const response = await createUser("token-value", {
      username: "alice",
      email: "alice@example.com",
      password: "secret"
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-value"
      },
      body: JSON.stringify({
        username: "alice",
        email: "alice@example.com",
        password: "secret"
      })
    });
    expect(response.data.id).toBe("user-1");
  });

  it("sends user bulk status and role updates through generated JSON requests", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { updated_count: 2 },
            message: "OK",
            error: null
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { user_id: "user-1", role_codes: ["admin", "auditor"] },
            message: "OK",
            error: null
          }),
          { status: 200 }
        )
      );

    await updateUsersStatus("token-value", { user_ids: ["user-1", "user-2"], is_active: false });
    await updateUserRoles("token-value", "user-1", ["admin", "auditor"]);

    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:8000/api/v1/users/bulk-status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-value"
      },
      body: JSON.stringify({ user_ids: ["user-1", "user-2"], is_active: false })
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:8000/api/v1/users/user-1/roles", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-value"
      },
      body: JSON.stringify({ role_codes: ["admin", "auditor"] })
    });
  });

  it("sends role writes and permission updates through generated JSON requests", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { id: "role-1", code: "auditor", name: "Auditor", description: null, is_system: false },
            message: "OK",
            error: null
          }),
          { status: 201 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { role_id: "role-1", permission_codes: ["menu:audit"] },
            message: "OK",
            error: null
          }),
          { status: 200 }
        )
      );

    await createRole("token-value", { code: "auditor", name: "Auditor" });
    await updateRolePermissions("token-value", "role-1", ["menu:audit"]);

    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:8000/api/v1/roles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-value"
      },
      body: JSON.stringify({ code: "auditor", name: "Auditor" })
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:8000/api/v1/roles/role-1/permissions", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-value"
      },
      body: JSON.stringify({ permission_codes: ["menu:audit"] })
    });
  });

  it("sends department writes and deletes through generated requests", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { id: "dept-1", code: "ops", name: "Ops" },
            message: "OK",
            error: null
          }),
          { status: 201 }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await createDepartment("token-value", { code: "ops", name: "Ops" });
    await deleteDepartment("token-value", "dept-1");

    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:8000/api/v1/departments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-value"
      },
      body: JSON.stringify({ code: "ops", name: "Ops" })
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:8000/api/v1/departments/dept-1", {
      method: "DELETE",
      headers: {
        Authorization: "Bearer token-value"
      }
    });
  });

  it("sends dictionary writes through generated JSON requests", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { id: "dict-1", code: "employee_status", name: "Employee Status" },
            message: "OK",
            error: null
          }),
          { status: 201 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { id: "item-1", label: "Enabled", value: "enabled" },
            message: "OK",
            error: null
          }),
          { status: 200 }
        )
      );

    await createDictionaryType("token-value", {
      code: "employee_status",
      name: "Employee Status"
    });
    await updateDictionaryItem("token-value", "item-1", { label: "Enabled" });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:8000/api/v1/dictionaries/types", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-value"
      },
      body: JSON.stringify({ code: "employee_status", name: "Employee Status" })
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:8000/api/v1/dictionaries/items/item-1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-value"
      },
      body: JSON.stringify({ label: "Enabled" })
    });
  });

  it("sends file metadata creates through generated JSON requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { id: "file-1", filename: "stored.pdf", original_filename: "contract.pdf" },
          message: "OK",
          error: null
        }),
        { status: 201 }
      )
    );

    await createFileAttachment("token-value", {
      filename: "stored.pdf",
      original_filename: "contract.pdf",
      size_bytes: 123,
      storage_path: "local/stored.pdf"
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-value"
      },
      body: JSON.stringify({
        filename: "stored.pdf",
        original_filename: "contract.pdf",
        size_bytes: 123,
        storage_path: "local/stored.pdf"
      })
    });
  });

  it("exports audit logs using generated URL parameter mapping", async () => {
    const csvBlob = new Blob(["id,action\n"], { type: "text/csv" });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(csvBlob, {
          status: 200,
          headers: { "Content-Type": "text/csv" }
        })
      )
      .mockResolvedValueOnce(
        new Response(csvBlob, {
          status: 200,
          headers: { "Content-Type": "text/csv" }
        })
      );

    await exportOperationLogs("token-value", {
      q: "login",
      status: "success",
      startedAt: "2026-01-01T00:00:00",
      endedAt: "2026-01-31T23:59:59",
      page: 3,
      pageSize: 15
    });
    await exportLoginLogs("token-value", {
      q: "admin",
      status: "failure",
      page: 1,
      pageSize: 10
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/v1/audit/operation-logs/export?q=login&status=success&started_at=2026-01-01T00%3A00%3A00&ended_at=2026-01-31T23%3A59%3A59",
      {
        headers: {
          Authorization: "Bearer token-value"
        }
      }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/v1/audit/login-logs/export?q=admin&status=failure",
      {
        headers: {
          Authorization: "Bearer token-value"
        }
      }
    );
  });

  it("uploads files through the generated multipart request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { id: "file-1", filename: "stored.pdf", original_filename: "contract.pdf" },
          message: "OK",
          error: null
        }),
        { status: 201 }
      )
    );
    const file = new File(["content"], "contract.pdf", { type: "application/pdf" });

    const response = await uploadFileAttachment("token-value", file);

    const [, options] = fetchMock.mock.calls[0]!;
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:8000/api/v1/files/upload");
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({ Authorization: "Bearer token-value" });
    expect(options?.body).toBeInstanceOf(FormData);
    expect((options?.body as FormData).get("upload")).toBe(file);
    expect(response.data.id).toBe("file-1");
  });

  it("downloads files using the generated URL helper", async () => {
    const fileBlob = new Blob(["content"], { type: "application/pdf" });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(fileBlob, { status: 200 }));

    const response = await downloadFileAttachment("token-value", "file-1");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/files/file-1/download", {
      headers: {
        Authorization: "Bearer token-value"
      }
    });
    expect(response.size).toBe(fileBlob.size);
  });
});
