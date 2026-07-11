import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
    }),
    nitro(),
    react(),
  ],
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "lucide-react",
    ],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Heavy animation library — loaded only by pages that use it
          if (id.includes("framer-motion")) return "framer-motion";
          // Supabase client — separate from app code
          if (id.includes("@supabase")) return "supabase";
          // Radix UI primitives — separate long-lived cache chunk
          if (id.includes("@radix-ui")) return "radix";
          // React ecosystem core
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "react-vendor";
          // TanStack libraries
          if (id.includes("@tanstack")) return "tanstack";
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    host: "::",
    port: 8080,
  },
});
