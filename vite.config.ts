import { createHash, randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/*
  The `roles` branch: the same club app, behind a sign-in, with two kinds of
  people in it.

  An administrator sees everything. A parent sees the squad and attendance and is
  refused the club's finances - by this server, not only by a hidden link.

  Only password HASHES live here. The passwords themselves are stored in the
  SafeMerge project's settings and reach a test run as environment variables, so
  a spec file cannot sign in by copying a value out of this repository.
*/

type Role = "admin" | "viewer";

interface Account {
  email: string;
  passwordSha256: string;
  name: string;
  role: Role;
}

const ACCOUNTS: Account[] = [
  {
    email: "coach@fixture.test",
    passwordSha256: "0b1da9e4e18014c1cce43525ac03bb0e4ef0a531b3e7c9b4ff0b8f98690c3f17",
    name: "Morgan Hale",
    role: "admin",
  },
  {
    email: "parent@fixture.test",
    passwordSha256: "dc836a3ab1af0ef5bf85577b937a2214f10fd14b49206790c5c6c734fedb0d3a",
    name: "Sam Okoro",
    role: "viewer",
  },
];

/** The fixture's data, and who may read each part of it. */
const DATA: Record<string, { roles: Role[]; body: unknown }> = {
  "/api/players": {
    roles: ["admin", "viewer"],
    body: {
      players: [
        { id: "p1", name: "Priya Raman", shirt: 7, goals: 12 },
        { id: "p2", name: "Tomas Vidal", shirt: 21, goals: 4 },
        { id: "p3", name: "Amara Okafor", shirt: 3, goals: 9 },
      ],
    },
  },
  /* `total` is stated by the server, not added up by the page. See main's README. */
  "/api/finance": {
    roles: ["admin"],
    body: {
      entries: [
        { id: "f1", label: "Sponsorship", amount: 2400 },
        { id: "f2", label: "Subs", amount: 860 },
      ],
      total: 3260,
    },
  },
  "/api/attendance": {
    roles: ["admin", "viewer"],
    body: {
      sessions: [
        { id: "s1", week: 1, present: 14 },
        { id: "s2", week: 2, present: 11 },
      ],
    },
  },
};

/** Sessions live as long as the dev server does. */
const SESSIONS = new Map<string, Account>();

/*
  `expiresIn` is a number on purpose. SafeMerge's wrong-value mutation rewrites
  numbers and leaves strings alone whenever a response has one, so this keeps the
  token and the role intact and puts the mutation on the club's data.
*/
const SESSION_SECONDS = 3600;

function publicUser(account: Account) {
  return { name: account.name, email: account.email, role: account.role };
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function sessionFor(req: IncomingMessage): Account | null {
  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) return null;
  return SESSIONS.get(header.slice("Bearer ".length).trim()) ?? null;
}

function mockApi(): Plugin {
  return {
    name: "safemerge-fixture-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0] ?? "";
        const method = (req.method ?? "GET").toUpperCase();

        if (url === "/api/auth/login" && method === "POST") {
          void readJson(req).then((body) => {
            const email = typeof body["email"] === "string" ? body["email"].trim().toLowerCase() : "";
            const password = typeof body["password"] === "string" ? body["password"] : "";
            const hash = createHash("sha256").update(password).digest("hex");
            const account = ACCOUNTS.find((entry) => entry.email === email && entry.passwordSha256 === hash);
            if (!account) {
              send(res, 401, { error: "Email or password is incorrect." });
              return;
            }
            const token = randomBytes(24).toString("hex");
            SESSIONS.set(token, account);
            send(res, 200, { token, expiresIn: SESSION_SECONDS, user: publicUser(account) });
          });
          return;
        }

        if (url === "/api/auth/logout" && method === "POST") {
          const header = req.headers.authorization ?? "";
          SESSIONS.delete(header.slice("Bearer ".length).trim());
          send(res, 200, { signedOut: true, expiresIn: 0 });
          return;
        }

        if (url === "/api/me" && method === "GET") {
          const account = sessionFor(req);
          if (!account) send(res, 401, { error: "Sign in first." });
          else send(res, 200, { user: publicUser(account), expiresIn: SESSION_SECONDS });
          return;
        }

        const route = DATA[url];
        if (route === undefined || method !== "GET") return next();

        const account = sessionFor(req);
        if (!account) {
          send(res, 401, { error: "Sign in first." });
          return;
        }
        if (!route.roles.includes(account.role)) {
          send(res, 403, { error: "You do not have permission to view this." });
          return;
        }
        send(res, 200, route.body);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), mockApi()],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
});
