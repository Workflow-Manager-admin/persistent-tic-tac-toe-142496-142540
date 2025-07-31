import { component$, useSignal, $ } from "@builder.io/qwik";
import { listGames } from "./api";
import type { Game } from "./api";

type Props = {
  onReplayRequested: (gameId: number) => void;
};

// PUBLIC_INTERFACE
export const HistoryView = component$<Props>(({ onReplayRequested }) => {
  const games = useSignal<Game[] | null>(null);
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const replayRequestGameId = useSignal<number | null>(null);

  if (replayRequestGameId.value !== null) {
    onReplayRequested(replayRequestGameId.value);
    replayRequestGameId.value = null;
  }

  const fetchGames = $(async () => {
    loading.value = true;
    error.value = null;
    try {
      const recentGames = await listGames(20);
      games.value = recentGames;
    } catch (e: any) {
      error.value = "Failed to load recent games.";
    } finally {
      loading.value = false;
    }
  });

  // fetch on mount
  if (games.value === null) fetchGames();

  return (
    <div class="history-view">
      <h3>Game History</h3>
      <button onClick$={fetchGames} disabled={loading.value}>
        {loading.value ? "Loading..." : "Refresh"}
      </button>
      {error.value && <div class="err">{error.value}</div>}
      {games.value && (
        <ul class="gamelist">
          {games.value.map((g) => (
            <li key={g.id}>
              <span>
                <b>#{g.id}</b>{" "}
                <span style="color:#90caf9">
                  {g.player_x.username}
                </span>{" "}
                vs{" "}
                <span style="color:#ffd740">
                  {g.player_o ? g.player_o.username : "?"}
                </span>
              </span>
              <span style="margin-left:1em;">
                {g.winner
                  ? g.winner === "Draw"
                    ? <b class="drawmark">Draw</b>
                    : `Winner: ${g.winner}`
                  : g.finished_at
                  ? "Finished"
                  : "In Progress"}
              </span>
              <button
                class="replaybtn"
                onClick$={() => { replayRequestGameId.value = g.id; }}
              >
                Review
              </button>
            </li>
          ))}
        </ul>
      )}
      <style>
        {`
          .history-view {
            background: #111A26;
            padding: 1.2em 1.7em;
            border-radius: 11px;
            margin-top: 2em;
            margin-bottom: 1em;
            color: #fff;
          }
          .gamelist {
            list-style: none;
            margin: 1em 0 0 0;
            padding: 0;
          }
          .gamelist li {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding:0.5em 0;
            border-bottom: 1px solid #202a3c;
          }
          .gamelist li:last-child {border-bottom:none;}
          .replaybtn {
            background: var(--primary-color, #1976d2);
            color: var(--secondary-color, #fff);
            border: none;
            border-radius: 4px;
            padding: 0.43em 1.2em;
            font-size: 1em;
            cursor: pointer;
            margin-left: 1em;
          }
          .drawmark {color: #ffe082;}
          .err {color: #ffc107;}
          @media(max-width:500px){.history-view{padding:0.8em;}}
        `}
      </style>
    </div>
  );
});
