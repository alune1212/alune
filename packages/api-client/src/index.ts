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
  is_active: boolean;
  is_superuser: boolean;
  permissions: string[];
};

export type LoginCredentials = {
  username: string;
  password: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function parseError(response: Response, fallbackMessage: string): Promise<Error> {
  try {
    const body = (await response.json()) as { detail?: string };
    return new Error(body.detail ?? fallbackMessage);
  } catch {
    return new Error(fallbackMessage);
  }
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
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to load current user");
  }

  return response.json() as Promise<ApiResponse<UserPublic>>;
}
