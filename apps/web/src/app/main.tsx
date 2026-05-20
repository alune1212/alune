import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Providers } from "@/app/providers";
import { configureApiClient } from "@alune/api-client";
import "@/styles/globals.css";

configureApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL
});

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Providers />
  </StrictMode>
);
