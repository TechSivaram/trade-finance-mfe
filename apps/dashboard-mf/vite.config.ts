import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "dashboard_mf",
      filename: "remoteEntry.js",
      exposes: { "./DashboardApp": "./src/DashboardApp.tsx" },
      shared: ["react", "react-dom"],
    }),
  ],
  server: { port: 5001, strictPort: true },
  build: { target: "esnext" },
});
