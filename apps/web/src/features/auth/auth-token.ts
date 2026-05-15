const accessTokenKey = "alune-platform.access-token";

export function readAccessToken(): string | null {
  return window.localStorage.getItem(accessTokenKey);
}

export function saveAccessToken(token: string): void {
  window.localStorage.setItem(accessTokenKey, token);
}

export function clearAccessToken(): void {
  window.localStorage.removeItem(accessTokenKey);
}
