import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

import { LoginPage } from "@/features/auth/login-page";
import { rootRoute } from "@/routes/__root";

const loginSearchSchema = z.object({
  expired: z.boolean().optional().default(false),
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
  validateSearch: loginSearchSchema,
});
