// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import deno from "@deno/astro-adapter";
import process from "node:process";

// https://astro.build/config
export default defineConfig({
  vite: { plugins: [tailwindcss()] },
  output: "server",
  adapter: deno(
    { port: process.env.PORT, hostname: process.env.HOSTNAME },
  ),
});
