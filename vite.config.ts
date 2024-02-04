import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals();

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
    }),
    tsconfigPaths(),
    visualizer({ emitFile: true }),
  ],
});
