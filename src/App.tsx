/// <reference types="vite/client" />
import { useEffect, useState } from "react";

interface Listed {
  name: string;
  url: string;
}
interface Berry {
  name: string;
  growth_time: number;
  max_harvest: number;
}

/*
  Two data calls, written the two ways a split frontend reaches its backend.

  The list is fetched from a RELATIVE path. In production something in front of
  this app routes /api to the real backend; in a sandbox nothing does, so the
  dev server is asked for a path it has never heard of. That is the case the
  API bridge forwards.

  The berry is fetched from VITE_API_URL when the environment provides one, and
  from the same relative path when it does not. SafeMerge injects that variable
  when it boots the app, so this call exercises the injection half of the
  bridge rather than the forwarding half.
*/
const API = import.meta.env.VITE_API_URL ?? "";

async function load<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function App() {
  const [pokemon, setPokemon] = useState<Listed[] | null>(null);
  const [berry, setBerry] = useState<Berry | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      const [list, cheri] = await Promise.all([
        load<{ results: Listed[] }>("/api/v2/pokemon?limit=3"),
        load<Berry>(`${API}/api/v2/berry/1`),
      ]);
      if (!live) return;
      setFailed(list === null || cheri === null);
      setPokemon(list?.results ?? []);
      setBerry(cheri);
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 32, maxWidth: 720 }}>
      <h1>Pokédex</h1>
      {failed && <p data-testid="load-error">Could not reach the Pokédex API.</p>}

      <h2>First three</h2>
      <ul>
        {(pokemon ?? []).map((entry) => (
          <li key={entry.name} data-testid="pokemon-row">
            {entry.name}
          </li>
        ))}
      </ul>

      <h2>Berry</h2>
      {berry && (
        <dl>
          <dt>Name</dt>
          <dd data-testid="berry-name">{berry.name}</dd>
          <dt>Growth time</dt>
          <dd data-testid="berry-growth">{berry.growth_time}</dd>
          <dt>Max harvest</dt>
          <dd data-testid="berry-harvest">{berry.max_harvest}</dd>
        </dl>
      )}
    </main>
  );
}
