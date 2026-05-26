import { type ReactNode } from "react";

import { useAuth } from "@/features/auth/auth-provider";

type RequirePermissionProps = {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
};

export function RequirePermission({ permission, children, fallback = null }: RequirePermissionProps) {
  const auth = useAuth();

  if (!auth.isAuthenticated || !auth.user) {
    return null;
  }

  const hasPermission = auth.user.is_superuser || (auth.user.permissions ?? []).includes(permission);

  return hasPermission ? children : fallback;
}
