// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import react from "@astrojs/react";

const resolveBase = (path) => fileURLToPath(new URL(path, import.meta.url));

// https://astro.build/config
export default defineConfig({
  output: "server",

  adapter: node({
    mode: "standalone",
  }),

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@layouts": resolveBase("./src/layouts"),
        "@styles": resolveBase("./src/styles"),
        "@components": resolveBase("./src/components"),
        "@ui": resolveBase("./src/components/ui"),
        "@lib": resolveBase("./src/lib"),
        "@hooks": resolveBase("./src/hooks"),
        "@utils": resolveBase("./src/lib/utils"),
      },
    },
    optimizeDeps: {
      exclude: ['@hugeicons/core-free-icons', '@hugeicons/react'],
    },
  },

  integrations: [react()]
});
