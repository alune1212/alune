const defaultApiBaseUrl = "http://localhost:8000";

let apiBaseUrl = defaultApiBaseUrl;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/u, "");
}

export function configureApiClient(options: { baseUrl?: string }): void {
  if (!options.baseUrl) {
    apiBaseUrl = defaultApiBaseUrl;
    return;
  }

  apiBaseUrl = normalizeBaseUrl(options.baseUrl);
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}
