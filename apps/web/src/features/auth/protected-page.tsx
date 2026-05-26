import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ForbiddenPage } from "@/features/auth/forbidden-page";
import { RequireAuth } from "@/features/auth/require-auth";
import { RequirePermission } from "@/features/auth/require-permission";

type ProtectedPageProps = {
  permission: string;
  children: ReactNode;
};

export function ProtectedPage({ permission, children }: ProtectedPageProps) {
  return (
    <RequireAuth>
      <AppShell>
        <RequirePermission permission={permission} fallback={<ForbiddenPage />}>
          {children}
        </RequirePermission>
      </AppShell>
    </RequireAuth>
  );
}
