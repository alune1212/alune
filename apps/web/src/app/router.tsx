import { createRouter } from "@tanstack/react-router";

import { departmentsRoute } from "@/routes/departments";
import { rootRoute } from "@/routes/__root";
import { indexRoute } from "@/routes/index";
import { loginRoute } from "@/routes/login";
import { rolesRoute } from "@/routes/roles";
import { usersRoute } from "@/routes/users";

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  usersRoute,
  rolesRoute,
  departmentsRoute
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
