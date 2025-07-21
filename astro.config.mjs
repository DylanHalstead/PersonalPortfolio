// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { enhancedImages } from "@sveltejs/enhanced-img";
import svelte from "@astrojs/svelte";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss(), enhancedImages()],
    ssr: {
      noExternal: ["@tailwindcss/typography"],
    },
  },
  integrations: [
    svelte({
      include: ["**/svelte/*.svelte"],
    }),
    sitemap(),
  ],
  site: "https://dylanhalstead.com/",
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
