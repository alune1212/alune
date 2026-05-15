import { defineConfig } from "orval";

export default defineConfig({
  alunePlatform: {
    input: "http://localhost:8000/openapi.json",
    output: {
      target: "src/generated/api.ts",
      client: "react-query",
      mode: "single",
      mock: true
    }
  }
});
