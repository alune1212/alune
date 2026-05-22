import { useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";

import { clearAccessToken, readAccessToken, saveAccessToken } from "@/features/auth/auth-token";
import { useGetMeApiV1AuthMeGet, type UserPublic } from "@alune/api-client/generated";

type AuthContextValue = {
  token: string | null;
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionExpired: boolean;
  setSession: (token: string) => void;
  logout: () => void;
  clearExpiredFlag: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => readAccessToken());
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const expiredCleanupRef = useRef(false);

  const currentUserQuery = useGetMeApiV1AuthMeGet({
    query: {
      queryKey: ["auth", "me", token],
      enabled: token !== null,
      retry: false,
    },
    request: {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  });
  const currentUser = currentUserQuery.data?.data.data ?? null;

  useEffect(() => {
    const errorStatus = (currentUserQuery.error as { status?: number } | null)?.status;
    if (errorStatus === 401 && token && !expiredCleanupRef.current) {
      expiredCleanupRef.current = true;
      clearAccessToken();
      queryClient.removeQueries({ queryKey: ["auth"] });
      setToken(null);
      setIsSessionExpired(true);
    }
  }, [currentUserQuery.error, token, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user: currentUser,
      isAuthenticated: token !== null && currentUserQuery.isSuccess,
      isLoading: token !== null && currentUserQuery.isLoading,
      isSessionExpired,
      setSession: (nextToken: string) => {
        saveAccessToken(nextToken);
        setToken(nextToken);
        setIsSessionExpired(false);
        expiredCleanupRef.current = false;
        queryClient.invalidateQueries({ queryKey: ["auth"] });
      },
      logout: () => {
        clearAccessToken();
        setToken(null);
        queryClient.removeQueries({ queryKey: ["auth"] });
      },
      clearExpiredFlag: () => {
        setIsSessionExpired(false);
      },
    }),
    [currentUser, currentUserQuery.isLoading, currentUserQuery.isSuccess, queryClient, token, isSessionExpired],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
