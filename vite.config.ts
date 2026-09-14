import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/*
  A split repository, on purpose.

  This branch is the frontend half only. Its data lives on another host -
  PokeAPI - and nothing here serves /api. There is deliberately no mock API
  plugin and no dev-server proxy: either would make this dev server answer the
  data calls itself, and the thing this branch exists to exercise is what
  SafeMerge does when it does not.

  That is the shape of most real split repositories inside a sandbox. The dev
  proxy, if there is one, points at a backend running on the developer's own
  machine, and there is no such machine in a sandbox.
*/
export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
});
