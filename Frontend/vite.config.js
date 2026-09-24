


import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Injects a strict Content-Security-Policy meta tag into the production build.
// It is intentionally build-only: Vite's dev server injects an inline React
// Fast-Refresh preamble which a strict script-src would block.
const injectCsp = (env) => ({
  name: "inject-csp",
  apply: "build",
  transformIndexHtml(html) {
    // The app's API is cross-origin in dev (VITE_API_URL) and is an allowlisted
    // remote origin in deployments, so connect-src must permit it. Relative
    // API URLs are same-origin and covered by 'self'.
    let apiOrigin = "'self'";
    const apiUrl = env.VITE_API_URL;
    if (apiUrl && /^https?:\/\//i.test(apiUrl.trim())) {
      try {
        const origin = new URL(apiUrl.trim()).origin;
        if (origin && origin !== "null") apiOrigin = origin;
      } catch {
        // fall through to 'self'
      }
    }
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "script-src 'self'",
      // Inline style attributes are used by the app and Quill, so they are the
      // only inline allowance. No unsafe-eval / unsafe-inline for scripts.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      `connect-src 'self' ${apiOrigin}`,
    ].join("; ");
    return html.replace(
      /<title>/i,
      `<meta http-equiv="Content-Security-Policy" content="${csp}" />\n    <title>`
    );
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "");
  return {
    plugins: [react(), tailwindcss(), injectCsp(env)],
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
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**/*.{js,jsx}'],
        exclude: [
          'src/**/*.test.{js,jsx}',
          'src/setupTests.js',
          'src/main.jsx',
        ],
      },
    },
  };
});