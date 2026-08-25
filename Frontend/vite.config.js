


import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  // Add test configuration inside the same export
  test: {
    globals: true, // Makes Vitest APIs available globally
    environment: 'jsdom', // Uses jsdom to simulate a browser environment
    setupFiles: './src/setupTests.js', // Points to a file that runs before each test
  },
});