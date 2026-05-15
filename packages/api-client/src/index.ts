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

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function fetchHealthStatus(): Promise<ApiResponse<HealthStatus>> {
  const response = await fetch(`${apiBaseUrl}/api/v1/health`);

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<ApiResponse<HealthStatus>>;
}
