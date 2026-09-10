import { useEffect, useState } from "react";

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
  /** Stated by the API, not added up here. See the note in vite.config.ts. */
  total: number | null;
}
interface Session {
  id: string;
  week: number;
  present: number;
}

async function load<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(path);
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export function App() {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      const [p, f, a] = await Promise.all([
        load<{ players: Player[] } | null>("/api/players", null),
        load<Finance | null>("/api/finance", null),
        load<{ sessions: Session[] } | null>("/api/attendance", null),
      ]);
      if (!live) return;
      setFailed(p === null || f === null || a === null);
      setPlayers(p?.players ?? []);
      setEntries(f?.entries ?? []);
      setTotal(f?.total ?? null);
      setSessions(a?.sessions ?? []);
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 32, maxWidth: 720 }}>
      <h1>Squad</h1>
      {failed && <p data-testid="load-error">Could not load the club&apos;s data.</p>}

      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Goals</th>
          </tr>
        </thead>
        <tbody>
          {(players ?? []).map((player) => (
            <tr key={player.id} data-testid="player-row">
              <td>
                {player.name} &middot; #{player.shirt}
              </td>
              <td data-testid="player-goals">{player.goals}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Finance</h2>
      <ul>
        {(entries ?? []).map((entry) => (
          <li key={entry.id} data-testid="finance-row">
            {entry.label}: <span data-testid="finance-amount">{entry.amount}</span>
          </li>
        ))}
      </ul>
      <p data-testid="finance-total">Total income: {total ?? ""}</p>

      <h2>Attendance</h2>
      <ul>
        {(sessions ?? []).map((session) => (
          <li key={session.id} data-testid="session-row">
            Week {session.week}: {session.present} present
          </li>
        ))}
      </ul>
    </main>
  );
}
