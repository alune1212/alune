// TODO: Replace with Orval-generated API client from ./generated/api.

export type ApiResponse<TData> = {
  success: boolean;
  data: TData;
  message: string;
  error: string | null;
};

export type HealthStatus = {
  status: string;
  service: string;
};

export type Token = {
  access_token: string;
  token_type: "bearer";
};

export type UserPublic = {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  department_id: string | null;
  is_active: boolean;
  is_superuser: boolean;
  permissions: string[];
};

export type UserManagementItem = {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  department_id: string | null;
  is_active: boolean;
  is_superuser: boolean;
};

export type UserCreate = {
  username: string;
  email: string;
  full_name?: string | null;
  password: string;
  department_id?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
};

export type UserUpdate = {
  email?: string | null;
  full_name?: string | null;
  department_id?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
};

export type RolePublic = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
};

export type PermissionPublic = {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
};

export type RolePermissionPublic = {
  role_id: string;
  permission_codes: string[];
};

export type DepartmentPublic = {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export type DepartmentCreate = {
  code: string;
  name: string;
  parent_id?: string | null;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type DepartmentUpdate = Partial<DepartmentCreate>;

export type OperationLogPublic = {
  id: string;
  actor_user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: string;
  detail: string | null;
};

export type LoginLogPublic = {
  id: string;
  username: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: string;
  message: string | null;
};

export type DictionaryTypePublic = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
};

export type DictionaryItemPublic = {
  id: string;
  type_id: string;
  label: string;
  value: string;
  sort_order: number;
  is_active: boolean;
};

export type DictionaryTypeCreate = {
  code: string;
  name: string;
  description?: string | null;
  is_system?: boolean;
};

export type DictionaryItemCreate = {
  type_id: string;
  label: string;
  value: string;
  sort_order?: number;
  is_active?: boolean;
};

export type FileAttachmentPublic = {
  id: string;
  filename: string;
  original_filename: string;
  content_type: string | null;
  size_bytes: number;
  storage_path: string;
  checksum: string | null;
  uploaded_by_user_id: string | null;
};

export type FileAttachmentCreate = {
  filename: string;
  original_filename: string;
  content_type?: string | null;
  size_bytes: number;
  storage_path: string;
  checksum?: string | null;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function parseError(response: Response, fallbackMessage: string): Promise<Error> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    return new Error(typeof body.detail === "string" ? body.detail : fallbackMessage);
  } catch {
    return new Error(fallbackMessage);
  }
}

function bearerHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`
  };
}

async function fetchJson<TData>(url: string, options?: RequestInit): Promise<ApiResponse<TData>> {
  const response = await fetch(`${apiBaseUrl}${url}`, options);

  if (!response.ok) {
    throw await parseError(response, `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<ApiResponse<TData>>;
}

export async function fetchHealthStatus(): Promise<ApiResponse<HealthStatus>> {
  const response = await fetch(`${apiBaseUrl}/api/v1/health`);

  if (!response.ok) {
    throw await parseError(response, `Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<ApiResponse<HealthStatus>>;
}

export async function loginWithPassword(credentials: LoginCredentials): Promise<ApiResponse<Token>> {
  const body = new URLSearchParams();
  body.set("username", credentials.username);
  body.set("password", credentials.password);

  const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    throw await parseError(response, "Login failed");
  }

  return response.json() as Promise<ApiResponse<Token>>;
}

export async function fetchCurrentUser(token: string): Promise<ApiResponse<UserPublic>> {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/me`, {
    headers: bearerHeaders(token)
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to load current user");
  }

  return response.json() as Promise<ApiResponse<UserPublic>>;
}

export async function fetchUsers(token: string): Promise<ApiResponse<UserManagementItem[]>> {
  return fetchJson<UserManagementItem[]>("/api/v1/users", {
    headers: bearerHeaders(token)
  });
}

export async function createUser(
  token: string,
  payload: UserCreate
): Promise<ApiResponse<UserManagementItem>> {
  return fetchJson<UserManagementItem>("/api/v1/users", {
    method: "POST",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function updateUser(
  token: string,
  userId: string,
  payload: UserUpdate
): Promise<ApiResponse<UserManagementItem>> {
  return fetchJson<UserManagementItem>(`/api/v1/users/${userId}`, {
    method: "PATCH",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function fetchRoles(token: string): Promise<ApiResponse<RolePublic[]>> {
  return fetchJson<RolePublic[]>("/api/v1/roles", {
    headers: bearerHeaders(token)
  });
}

export async function fetchPermissions(token: string): Promise<ApiResponse<PermissionPublic[]>> {
  return fetchJson<PermissionPublic[]>("/api/v1/roles/permissions", {
    headers: bearerHeaders(token)
  });
}

export async function fetchRolePermissions(
  token: string,
  roleId: string
): Promise<ApiResponse<RolePermissionPublic>> {
  return fetchJson<RolePermissionPublic>(`/api/v1/roles/${roleId}/permissions`, {
    headers: bearerHeaders(token)
  });
}

export async function updateRolePermissions(
  token: string,
  roleId: string,
  permissionCodes: string[]
): Promise<ApiResponse<RolePermissionPublic>> {
  return fetchJson<RolePermissionPublic>(`/api/v1/roles/${roleId}/permissions`, {
    method: "PUT",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ permission_codes: permissionCodes })
  });
}

export async function fetchDepartments(token: string): Promise<ApiResponse<DepartmentPublic[]>> {
  return fetchJson<DepartmentPublic[]>("/api/v1/departments", {
    headers: bearerHeaders(token)
  });
}

export async function createDepartment(
  token: string,
  payload: DepartmentCreate
): Promise<ApiResponse<DepartmentPublic>> {
  return fetchJson<DepartmentPublic>("/api/v1/departments", {
    method: "POST",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function updateDepartment(
  token: string,
  departmentId: string,
  payload: DepartmentUpdate
): Promise<ApiResponse<DepartmentPublic>> {
  return fetchJson<DepartmentPublic>(`/api/v1/departments/${departmentId}`, {
    method: "PATCH",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function deleteDepartment(token: string, departmentId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/v1/departments/${departmentId}`, {
    method: "DELETE",
    headers: bearerHeaders(token)
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to delete department");
  }
}

export async function fetchOperationLogs(token: string): Promise<ApiResponse<OperationLogPublic[]>> {
  return fetchJson<OperationLogPublic[]>("/api/v1/audit/operation-logs", {
    headers: bearerHeaders(token)
  });
}

export async function fetchLoginLogs(token: string): Promise<ApiResponse<LoginLogPublic[]>> {
  return fetchJson<LoginLogPublic[]>("/api/v1/audit/login-logs", {
    headers: bearerHeaders(token)
  });
}

export async function fetchDictionaryTypes(token: string): Promise<ApiResponse<DictionaryTypePublic[]>> {
  return fetchJson<DictionaryTypePublic[]>("/api/v1/dictionaries/types", {
    headers: bearerHeaders(token)
  });
}

export async function createDictionaryType(
  token: string,
  payload: DictionaryTypeCreate
): Promise<ApiResponse<DictionaryTypePublic>> {
  return fetchJson<DictionaryTypePublic>("/api/v1/dictionaries/types", {
    method: "POST",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function fetchDictionaryItems(token: string): Promise<ApiResponse<DictionaryItemPublic[]>> {
  return fetchJson<DictionaryItemPublic[]>("/api/v1/dictionaries/items", {
    headers: bearerHeaders(token)
  });
}

export async function createDictionaryItem(
  token: string,
  payload: DictionaryItemCreate
): Promise<ApiResponse<DictionaryItemPublic>> {
  return fetchJson<DictionaryItemPublic>("/api/v1/dictionaries/items", {
    method: "POST",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function fetchFileAttachments(token: string): Promise<ApiResponse<FileAttachmentPublic[]>> {
  return fetchJson<FileAttachmentPublic[]>("/api/v1/files", {
    headers: bearerHeaders(token)
  });
}

export async function createFileAttachment(
  token: string,
  payload: FileAttachmentCreate
): Promise<ApiResponse<FileAttachmentPublic>> {
  return fetchJson<FileAttachmentPublic>("/api/v1/files", {
    method: "POST",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}
