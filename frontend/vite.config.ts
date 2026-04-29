import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        proxyTimeout: 600000, // 10 min — large video uploads
        timeout: 600000,
      },
      "/webhook": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/static": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/unsubscribe": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/access": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
})
