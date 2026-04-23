import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(here, "../..");

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, monorepoRoot, "");
  const localEnv = loadEnv(mode, here, "VITE_");

  return {
    envDir: monorepoRoot,
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        rootEnv.VITE_SUPABASE_URL ?? rootEnv.SUPABASE_URL ?? localEnv.VITE_SUPABASE_URL ?? "",
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        rootEnv.VITE_SUPABASE_PUBLISHABLE_KEY ??
          rootEnv.SUPABASE_PUBLISHABLE_KEY ??
          localEnv.VITE_SUPABASE_PUBLISHABLE_KEY ??
          "",
      ),
      "import.meta.env.VITE_BACKEND_URL": JSON.stringify(
        rootEnv.VITE_BACKEND_URL ?? localEnv.VITE_BACKEND_URL ?? "http://localhost:3000",
      ),
      "import.meta.env.VITE_CHROME_EXTENSION_ID": JSON.stringify(
        rootEnv.VITE_CHROME_EXTENSION_ID ?? localEnv.VITE_CHROME_EXTENSION_ID ?? "",
      ),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(here, "./src") },
    },
    server: { port: 5173 },
  };
});
