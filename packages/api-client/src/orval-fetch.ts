import { getApiBaseUrl } from "./runtime-config";

function resolveApiUrl(url: string): string {
  if (/^https?:\/\//u.test(url)) {
    return url;
  }

  return `${getApiBaseUrl()}${url}`;
}

function parseResponseBody(body: string, contentType: string | null): unknown {
  if (!body) {
    return {};
  }

  if (contentType?.includes("application/json")) {
    return JSON.parse(body) as unknown;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    // Non-JSON responses, such as CSV exports, are returned as plain text by the generated client.
  }

  return body;
}

export async function orvalFetch<TResponse>(url: string, options: RequestInit): Promise<TResponse> {
  const response = await fetch(resolveApiUrl(url), options);
  const body = [204, 205, 304].includes(response.status) ? "" : await response.text();
  const data = parseResponseBody(body, response.headers.get("content-type"));

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`) as Error & {
      info?: unknown;
      status?: number;
    };
    error.info = data;
    error.status = response.status;
    throw error;
  }

  return {
    data,
    status: response.status,
    headers: response.headers
  } as TResponse;
}
