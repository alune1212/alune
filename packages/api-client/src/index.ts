// TODO: Replace with Orval-generated API client from ./generated/api.

export type ApiResponse<TData> = {
  success: boolean;
  data: TData;
  message: string;
  error: string | null;
};

export type Page<TItem> = {
  items: TItem[];
  page: number;
  page_size: number;
  total: number;
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

export type UserPasswordUpdate = {
  password: string;
};

export type UserRolePublic = {
  user_id: string;
  role_codes: string[];
};

export type RolePublic = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
};

export type RoleCreate = {
  code: string;
  name: string;
  description?: string | null;
};

export type RoleUpdate = Partial<RoleCreate>;

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

export type DepartmentTreeNode = DepartmentPublic & {
  children: DepartmentTreeNode[];
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

export type DictionaryTypeUpdate = {
  code?: string;
  name?: string;
  description?: string | null;
};

export type DictionaryItemCreate = {
  type_id: string;
  label: string;
  value: string;
  sort_order?: number;
  is_active?: boolean;
};

export type DictionaryItemUpdate = {
  label?: string | null;
  value?: string | null;
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

export type ListParams = {
  q?: string;
  status?: string;
  departmentId?: string;
  roleCode?: string;
  startedAt?: string;
  endedAt?: string;
  page?: number;
  pageSize?: number;
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

function withListParams(url: string, params?: ListParams): string {
  const searchParams = new URLSearchParams();
  if (params?.q) {
    searchParams.set("q", params.q);
  }
  if (params?.status) {
    searchParams.set("status", params.status);
  }
  if (params?.departmentId) {
    searchParams.set("department_id", params.departmentId);
  }
  if (params?.roleCode) {
    searchParams.set("role_code", params.roleCode);
  }
  if (params?.startedAt) {
    searchParams.set("started_at", params.startedAt);
  }
  if (params?.endedAt) {
    searchParams.set("ended_at", params.endedAt);
  }
  if (params?.page) {
    searchParams.set("page", String(params.page));
  }
  if (params?.pageSize) {
    searchParams.set("page_size", String(params.pageSize));
  }

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
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

export async function fetchUsers(
  token: string,
  params?: ListParams
): Promise<ApiResponse<Page<UserManagementItem>>> {
  return fetchJson<Page<UserManagementItem>>(withListParams("/api/v1/users", params), {
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

export async function updateUserPassword(
  token: string,
  userId: string,
  payload: UserPasswordUpdate
): Promise<ApiResponse<UserManagementItem>> {
  return fetchJson<UserManagementItem>(`/api/v1/users/${userId}/password`, {
    method: "PATCH",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function fetchUserRoles(
  token: string,
  userId: string
): Promise<ApiResponse<UserRolePublic>> {
  return fetchJson<UserRolePublic>(`/api/v1/users/${userId}/roles`, {
    headers: bearerHeaders(token)
  });
}

export async function updateUserRoles(
  token: string,
  userId: string,
  roleCodes: string[]
): Promise<ApiResponse<UserRolePublic>> {
  return fetchJson<UserRolePublic>(`/api/v1/users/${userId}/roles`, {
    method: "PUT",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ role_codes: roleCodes })
  });
}

export async function fetchRoles(token: string): Promise<ApiResponse<RolePublic[]>> {
  return fetchJson<RolePublic[]>("/api/v1/roles", {
    headers: bearerHeaders(token)
  });
}

export async function createRole(
  token: string,
  payload: RoleCreate
): Promise<ApiResponse<RolePublic>> {
  return fetchJson<RolePublic>("/api/v1/roles", {
    method: "POST",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function updateRole(
  token: string,
  roleId: string,
  payload: RoleUpdate
): Promise<ApiResponse<RolePublic>> {
  return fetchJson<RolePublic>(`/api/v1/roles/${roleId}`, {
    method: "PATCH",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function deleteRole(token: string, roleId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/v1/roles/${roleId}`, {
    method: "DELETE",
    headers: bearerHeaders(token)
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to delete role");
  }
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

export async function fetchDepartments(
  token: string,
  params?: ListParams
): Promise<ApiResponse<Page<DepartmentPublic>>> {
  return fetchJson<Page<DepartmentPublic>>(withListParams("/api/v1/departments", params), {
    headers: bearerHeaders(token)
  });
}

export async function fetchDepartmentTree(token: string): Promise<ApiResponse<DepartmentTreeNode[]>> {
  return fetchJson<DepartmentTreeNode[]>("/api/v1/departments/tree", {
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

export async function fetchOperationLogs(
  token: string,
  params?: ListParams
): Promise<ApiResponse<Page<OperationLogPublic>>> {
  return fetchJson<Page<OperationLogPublic>>(withListParams("/api/v1/audit/operation-logs", params), {
    headers: bearerHeaders(token)
  });
}

export async function fetchLoginLogs(
  token: string,
  params?: ListParams
): Promise<ApiResponse<Page<LoginLogPublic>>> {
  return fetchJson<Page<LoginLogPublic>>(withListParams("/api/v1/audit/login-logs", params), {
    headers: bearerHeaders(token)
  });
}

export async function exportOperationLogs(token: string, params?: ListParams): Promise<Blob> {
  const response = await fetch(`${apiBaseUrl}${withListParams("/api/v1/audit/operation-logs/export", params)}`, {
    headers: bearerHeaders(token)
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to export operation logs");
  }

  return response.blob();
}

export async function exportLoginLogs(token: string, params?: ListParams): Promise<Blob> {
  const response = await fetch(`${apiBaseUrl}${withListParams("/api/v1/audit/login-logs/export", params)}`, {
    headers: bearerHeaders(token)
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to export login logs");
  }

  return response.blob();
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

export async function updateDictionaryType(
  token: string,
  typeId: string,
  payload: DictionaryTypeUpdate
): Promise<ApiResponse<DictionaryTypePublic>> {
  return fetchJson<DictionaryTypePublic>(`/api/v1/dictionaries/types/${typeId}`, {
    method: "PATCH",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function deleteDictionaryType(token: string, typeId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/v1/dictionaries/types/${typeId}`, {
    method: "DELETE",
    headers: bearerHeaders(token)
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to delete dictionary type");
  }
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

export async function updateDictionaryItem(
  token: string,
  itemId: string,
  payload: DictionaryItemUpdate
): Promise<ApiResponse<DictionaryItemPublic>> {
  return fetchJson<DictionaryItemPublic>(`/api/v1/dictionaries/items/${itemId}`, {
    method: "PATCH",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function deleteDictionaryItem(token: string, itemId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/v1/dictionaries/items/${itemId}`, {
    method: "DELETE",
    headers: bearerHeaders(token)
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to delete dictionary item");
  }
}

export async function fetchFileAttachments(
  token: string,
  params?: ListParams
): Promise<ApiResponse<Page<FileAttachmentPublic>>> {
  return fetchJson<Page<FileAttachmentPublic>>(withListParams("/api/v1/files", params), {
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

export async function uploadFileAttachment(
  token: string,
  file: File
): Promise<ApiResponse<FileAttachmentPublic>> {
  const formData = new FormData();
  formData.set("upload", file);

  return fetchJson<FileAttachmentPublic>("/api/v1/files/upload", {
    method: "POST",
    headers: bearerHeaders(token),
    body: formData
  });
}

export async function downloadFileAttachment(token: string, fileId: string): Promise<Blob> {
  const response = await fetch(`${apiBaseUrl}/api/v1/files/${fileId}/download`, {
    headers: bearerHeaders(token)
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to download file");
  }

  return response.blob();
}
