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
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      const [p, f, a] = await Promise.all([
        load<{ players: Player[] } | null>("/api/players", null),
        load<{ entries: Entry[] } | null>("/api/finance", null),
        load<{ sessions: Session[] } | null>("/api/attendance", null),
      ]);
      if (!live) return;
      setFailed(p === null || f === null || a === null);
      setPlayers(p?.players ?? []);
      setEntries(f?.entries ?? []);
      setSessions(a?.sessions ?? []);
    })();
    return () => {
      live = false;
    };
  }, []);

  const total = (entries ?? []).reduce((sum, entry) => sum + entry.amount, 0);

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
      <p data-testid="finance-total">Total income: {total}</p>

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
