import { createRouter } from "@tanstack/react-router";

import { appsRoute } from "@/routes/apps";
import { auditRoute } from "@/routes/audit";
import { departmentsRoute } from "@/routes/departments";
import { dictionariesRoute } from "@/routes/dictionaries";
import { filesRoute } from "@/routes/files";
import { rootRoute } from "@/routes/__root";
import { indexRoute } from "@/routes/index";
import { loginRoute } from "@/routes/login";
import { rolesRoute } from "@/routes/roles";
import { usersRoute } from "@/routes/users";

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  appsRoute,
  usersRoute,
  rolesRoute,
  departmentsRoute,
  auditRoute,
  dictionariesRoute,
  filesRoute
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent"
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
