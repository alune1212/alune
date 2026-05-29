import { describe, expect, it } from "vitest";

import auditSource from "./audit.tsx?raw";
import appsSource from "./apps.tsx?raw";
import chatSource from "./chat.tsx?raw";
import departmentsSource from "./departments.tsx?raw";
import documentsSource from "./documents.tsx?raw";
import dictionariesSource from "./dictionaries.tsx?raw";
import filesSource from "./files.tsx?raw";
import indexSource from "./index.tsx?raw";
import knowledgeBasesSource from "./knowledge-bases.tsx?raw";
import rolesSource from "./roles.tsx?raw";
import usersSource from "./users.tsx?raw";

const routePermissions = [
  ["index.tsx", indexSource, "menu:dashboard"],
  ["knowledge-bases.tsx", knowledgeBasesSource, "menu:knowledge"],
  ["documents.tsx", documentsSource, "menu:documents"],
  ["chat.tsx", chatSource, "menu:rag_chat"],
  ["apps.tsx", appsSource, "menu:apps"],
  ["users.tsx", usersSource, "menu:users"],
  ["roles.tsx", rolesSource, "menu:roles"],
  ["departments.tsx", departmentsSource, "menu:departments"],
  ["dictionaries.tsx", dictionariesSource, "menu:dictionaries"],
  ["audit.tsx", auditSource, "menu:audit"],
  ["files.tsx", filesSource, "menu:files"],
] as const;

describe("protected routes", () => {
  it.each(routePermissions)(
    "wraps %s with its route permission",
    (_routeFile, source, permission) => {
      expect(source).toContain("ProtectedPage");
      expect(source).toContain(`permission="${permission}"`);
    },
  );
});
