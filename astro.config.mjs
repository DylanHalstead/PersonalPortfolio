// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [
      // @ts-ignore - version mismatch between vite and tailwind
      tailwindcss(),
    ],
  },
  integrations: [
    svelte({
      include: ["**/svelte/*.svelte"],
    }),
  ],
  output: "static",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  experimental: {
    clientPrerender: true,
    contentIntellisense: true,
  },
});
