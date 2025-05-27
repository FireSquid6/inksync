import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ["path", "stream", "crypto"],
    }),
  ],
  build: {
    // for dev, disable later
    minify: false,
    target: "esnext",
  }
})
