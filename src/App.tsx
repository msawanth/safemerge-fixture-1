import { useCallback, useEffect, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";

type Role = "admin" | "viewer";

interface User {
  name: string;
  email: string;
  role: Role;
}
interface Player {
  id: string;
  name: string;
  shirt: number;
  goals: number;
}
interface Entry {
  id: string;
  label: string;
  amount: number;
}
interface Finance {
  entries: Entry[];
  /** Stated by the API, not added up here. */
  total: number;
}
interface Session {
  id: string;
  week: number;
  present: number;
}

const ROLE_LABEL: Record<Role, string> = { admin: "Club administrator", viewer: "Parent" };
const TOKEN_KEY = "fixture.token";

interface Reply<T> {
  status: number;
  body: T | null;
}

async function call<T>(path: string, token: string | null, init: RequestInit = {}): Promise<Reply<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    const text = await response.text();
    let body: T | null = null;
    try {
      body = text ? (JSON.parse(text) as T) : null;
    } catch {
      body = null;
    }
    return { status: response.status, body };
  } catch {
    return { status: 0, body: null };
  }
}

function readToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* a blocked storage just means signing in again */
  }
}

function usePath(): [string, (to: string) => void] {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const go = useCallback((to: string) => {
    window.history.pushState(null, "", to);
    setPath(to);
  }, []);
  return [path, go];
}

export function App() {
  const [path, go] = usePath();
  const [token, setToken] = useState<string | null>(readToken);
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(token !== null);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    let live = true;
    void call<{ user: User }>("/api/me", token).then((reply) => {
      if (!live) return;
      if (reply.status === 200 && reply.body) setUser(reply.body.user);
      else {
        writeToken(null);
        setToken(null);
      }
      setChecking(false);
    });
    return () => {
      live = false;
    };
  }, [token]);

  const signedIn = (next: string, who: User) => {
    writeToken(next);
    setUser(who);
    setToken(next);
  };

  const signOut = () => {
    void call("/api/auth/logout", token, { method: "POST" });
    writeToken(null);
    setUser(null);
    setToken(null);
    go("/");
  };

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 32, maxWidth: 720 }}>
      {checking ? (
        <p>Loading…</p>
      ) : !token || !user ? (
        <SignIn onSignedIn={signedIn} />
      ) : (
        <>
          <header style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
            <p data-testid="signed-in-as">
              Signed in as {user.name} &middot; {ROLE_LABEL[user.role]}
            </p>
            <button type="button" onClick={signOut}>
              Sign out
            </button>
          </header>
          <nav aria-label="Main" style={{ display: "flex", gap: 16 }}>
            <NavLink to="/" go={go}>
              Squad
            </NavLink>
            <NavLink to="/attendance" go={go}>
              Attendance
            </NavLink>
            {user.role === "admin" && (
              <NavLink to="/finance" go={go}>
                Finance
              </NavLink>
            )}
          </nav>
          {path === "/" ? (
            <SquadPage token={token} canAdd={user.role === "admin"} />
          ) : path === "/attendance" ? (
            <AttendancePage token={token} />
          ) : path === "/finance" ? (
            <FinancePage token={token} />
          ) : (
            <h1>Page not found</h1>
          )}
        </>
      )}
    </main>
  );
}

function NavLink({ to, go, children }: { to: string; go: (to: string) => void; children: ReactNode }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    go(to);
  };
  return (
    <a href={to} onClick={onClick}>
      {children}
    </a>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: (token: string, user: User) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    const reply = await call<{ token: string; user: User; error?: string }>("/api/auth/login", null, {
      method: "POST",
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    setBusy(false);
    if (reply.status === 200 && reply.body?.token) onSignedIn(reply.body.token, reply.body.user);
    else if (reply.status === 401) setError("Email or password is incorrect.");
    else setError("Signing in is not working right now. Try again in a moment.");
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12, maxWidth: 320 }}>
      <h1>Sign in to Fixture FC</h1>
      <label>
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button type="submit" disabled={busy}>
        Sign in
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

/** One GET, with the status kept, because a 403 and a failure must not look alike. */
function useData<T>(path: string, token: string): Reply<T> | null {
  const [reply, setReply] = useState<Reply<T> | null>(null);
  useEffect(() => {
    let live = true;
    setReply(null);
    void call<T>(path, token).then((next) => {
      if (live) setReply(next);
    });
    return () => {
      live = false;
    };
  }, [path, token]);
  return reply;
}

function SquadPage({ token, canAdd }: { token: string; canAdd: boolean }) {
  const [version, setVersion] = useState(0);
  const reply = useData<{ players: Player[] }>(`/api/players?v=${version}`, token);
  return (
    <section>
      <h1>Squad</h1>
      {canAdd && <AddPlayer token={token} onAdded={() => setVersion((v) => v + 1)} />}
      {reply === null ? (
        <p>Loading…</p>
      ) : reply.status !== 200 ? (
        <p data-testid="load-error">Could not load the squad.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Goals</th>
            </tr>
          </thead>
          <tbody>
            {(reply.body?.players ?? []).map((player) => (
              <tr key={player.id} data-testid="player-row">
                <td>
                  {player.name} &middot; #{player.shirt}
                </td>
                <td data-testid="player-goals">{player.goals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function AddPlayer({ token, onAdded }: { token: string; onAdded: () => void }) {
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError(null);
    const reply = await call<{ player: Player; error?: string }>("/api/players", token, {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        shirt: Number(form.get("shirt")),
        goals: Number(form.get("goals") || 0),
      }),
    });
    if (reply.status === 201) {
      formElement.reset();
      onAdded();
    } else {
      setError(reply.status === 403 ? "You do not have permission to add players." : "Could not add the player.");
    }
  };

  return (
    <form aria-label="Add a player" onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
      <label>
        Name
        <input name="name" required />
      </label>
      <label>
        Shirt number
        <input name="shirt" type="number" required />
      </label>
      <label>
        Goals
        <input name="goals" type="number" defaultValue={0} />
      </label>
      <button type="submit">Add player</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

function AttendancePage({ token }: { token: string }) {
  const reply = useData<{ sessions: Session[] }>("/api/attendance", token);
  return (
    <section>
      <h1>Attendance</h1>
      {reply === null ? (
        <p>Loading…</p>
      ) : reply.status !== 200 ? (
        <p data-testid="load-error">Could not load attendance.</p>
      ) : (
        <ul>
          {(reply.body?.sessions ?? []).map((session) => (
            <li key={session.id} data-testid="session-row">
              Week {session.week}: {session.present} present
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FinancePage({ token }: { token: string }) {
  const reply = useData<Finance>("/api/finance", token);
  if (reply === null) return <p>Loading…</p>;
  // Decided by what the server said, not by the role the page believes it has.
  if (reply.status === 403) {
    return (
      <section>
        <h1>Not allowed</h1>
        <p>You do not have permission to view the club&apos;s finances.</p>
      </section>
    );
  }
  if (reply.status !== 200 || !reply.body) {
    return (
      <section>
        <h1>Finance</h1>
        <p data-testid="load-error">Could not load the club&apos;s finances.</p>
      </section>
    );
  }
  return (
    <section>
      <h1>Finance</h1>
      <ul>
        {reply.body.entries.map((entry) => (
          <li key={entry.id} data-testid="finance-row">
            {entry.label}: <span data-testid="finance-amount">{entry.amount}</span>
          </li>
        ))}
      </ul>
      <p data-testid="finance-total">Total income: {reply.body.total}</p>
    </section>
  );
}
