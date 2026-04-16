import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 3011,
    host: true,
    allowedHosts: ["hri.thefirstimpression.ai"],
  },

  preview: {
    port: 3011,
    host: true,
    allowedHosts: ["hri.thefirstimpression.ai"],
  },

  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});