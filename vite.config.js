import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // `base` controls the URL path the site is served from.
  // - For Netlify and Vercel, leave it as "/" (the default).
  // - For GitHub Pages, change it to "/your-repo-name/"
  //   (see the deploy instructions at the end).
  base: "/",
});
