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

export type RolePublic = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
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
  const response = await fetch(`${apiBaseUrl}/api/v1/users`, {
    headers: bearerHeaders(token)
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to load users");
  }

  return response.json() as Promise<ApiResponse<UserManagementItem[]>>;
}

export async function fetchRoles(token: string): Promise<ApiResponse<RolePublic[]>> {
  const response = await fetch(`${apiBaseUrl}/api/v1/roles`, {
    headers: bearerHeaders(token)
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to load roles");
  }

  return response.json() as Promise<ApiResponse<RolePublic[]>>;
}

export async function fetchDepartments(token: string): Promise<ApiResponse<DepartmentPublic[]>> {
  const response = await fetch(`${apiBaseUrl}/api/v1/departments`, {
    headers: bearerHeaders(token)
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to load departments");
  }

  return response.json() as Promise<ApiResponse<DepartmentPublic[]>>;
}

export async function createDepartment(
  token: string,
  payload: DepartmentCreate
): Promise<ApiResponse<DepartmentPublic>> {
  const response = await fetch(`${apiBaseUrl}/api/v1/departments`, {
    method: "POST",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to create department");
  }

  return response.json() as Promise<ApiResponse<DepartmentPublic>>;
}
