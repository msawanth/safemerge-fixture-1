import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** The fixture's data. Deliberately shaped for the three mutations. */
const DATA: Record<string, unknown> = {
  "/api/players": {
    players: [
      { id: "p1", name: "Priya Raman", shirt: 7, goals: 12 },
      { id: "p2", name: "Tomas Vidal", shirt: 21, goals: 4 },
      { id: "p3", name: "Amara Okafor", shirt: 3, goals: 9 },
    ],
  },
  /*
    `total` is sent by the server, NOT computed from `entries`.

    That is the whole point of it. A total the page adds up itself agrees with
    its own rows by construction and can never disagree with them, so a test
    comparing the two proves nothing. A total the API states separately CAN
    disagree - and under a wrong-value mutation it does, because 2400 and 860
    are rewritten one way and 3260 another.
  */
  "/api/finance": {
    entries: [
      { id: "f1", label: "Sponsorship", amount: 2400 },
      { id: "f2", label: "Subs", amount: 860 },
    ],
    total: 3260,
  },
  "/api/attendance": {
    sessions: [
      { id: "s1", week: 1, present: 14 },
      { id: "s2", week: 2, present: 11 },
    ],
  },
};

function mockApi(): Plugin {
  return {
    name: "safemerge-fixture-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0] ?? "";
        const body = DATA[url];
        if (body === undefined) return next();
        res.setHeader("content-type", "application/json");
        res.setHeader("cache-control", "no-store");
        res.end(JSON.stringify(body));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), mockApi()],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
});
