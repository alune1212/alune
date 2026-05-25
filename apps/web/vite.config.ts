import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    exclude: [...configDefaults.exclude, "e2e/**"],
    restoreMocks: true,
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost:5173"
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const tanstackModules = [
            "@tanstack/react-query",
            "@tanstack/react-router",
            "@tanstack/react-table"
          ];
          const uiModules = [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-slot",
            "lucide-react",
            "sonner"
          ];
          if (tanstackModules.some((moduleName) => id.includes(`/node_modules/${moduleName}/`))) {
            return "tanstack";
          }
          if (uiModules.some((moduleName) => id.includes(`/node_modules/${moduleName}/`))) {
            return "ui";
          }
          return undefined;
        }
      }
    }
  }
});
