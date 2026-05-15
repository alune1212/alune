import { beforeEach, describe, expect, it } from "vitest";

import { clearAccessToken, readAccessToken, saveAccessToken } from "@/features/auth/auth-token";

describe("auth token storage", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        removeItem: (key: string) => {
          store.delete(key);
        },
        setItem: (key: string, value: string) => {
          store.set(key, value);
        }
      }
    });
  });

  it("stores and clears the access token", () => {
    clearAccessToken();

    expect(readAccessToken()).toBeNull();

    saveAccessToken("token-value");

    expect(readAccessToken()).toBe("token-value");

    clearAccessToken();

    expect(readAccessToken()).toBeNull();
  });
});
