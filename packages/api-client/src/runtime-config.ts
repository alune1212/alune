const defaultApiBaseUrl = "";

let apiBaseUrl = defaultApiBaseUrl;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/u, "");
}

export function configureApiClient(options: { baseUrl?: string }): void {
  apiBaseUrl = options.baseUrl ? normalizeBaseUrl(options.baseUrl) : defaultApiBaseUrl;
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}
