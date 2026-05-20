import { defineConfig } from "orval";

export default defineConfig({
  alunePlatform: {
    input: "openapi/openapi.json",
    output: {
      target: "src/generated/api.ts",
      client: "react-query",
      httpClient: "fetch",
      mode: "single",
      clean: true,
      override: {
        mutator: {
          path: "./src/orval-fetch.ts",
          name: "orvalFetch"
        }
      }
    }
  }
});
