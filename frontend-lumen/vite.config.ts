import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isLocal = !process.env.PORT || env.VITE_API_URL?.includes("localhost") || env.VITE_API_URL?.includes("127.0.0.1");

  return {
    server: {
      host: "0.0.0.0",
      port: Number(process.env.PORT) || 3000,
      // Allow any host so Emergent preview proxy can serve the dev server
      allowedHosts: true,
      strictPort: false,
      hmr: {
        overlay: false,
        clientPort: isLocal ? undefined : 443,
      },
    },
    preview: {
      host: "0.0.0.0",
      port: Number(process.env.PORT) || 3000,
      allowedHosts: true,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
