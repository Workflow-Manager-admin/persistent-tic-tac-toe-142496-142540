import { component$, useSignal, $, useStylesScoped$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LoginBox } from "../components/LoginBox";
import {
  createGame,
  getGame,
  joinGame,
  getGameHistory,
} from "../components/api";
import type { Game, Player, GameHistory } from "../components/api";
import { Board } from "../components/Board";
import { HistoryView } from "../components/HistoryView";

export default component$(() => {
  useStylesScoped$(`
    .rootdark {
      --primary-color: #1976d2;
      --secondary-color: #fff;
      --accent-color: #ffc107;
      --background-color: #12182b;
      --background-color2: #222e3d;
      --tile-bg: #233043;
    }
    body {background:var(--background-color);}
  `);

  // Player
  const player = useSignal<Player | null>(null);

  // Game state
  const game = useSignal<Game | null>(null);
  const boardLoading = useSignal(false);
  const gameError = useSignal<string | null>(null);
  const spectatorMode = useSignal(false);

  // History replay mode
  const replayHistory = useSignal<GameHistory | null>(null);
  const replayMoveIdx = useSignal(0);

  // Step 1: Login UI or show main content if already logged in
  if (!player.value) {
    return (
      <div class="rootdark">
        <LoginBox onLogin={(p) => (player.value = p)} />
      </div>
    );
  }

  // Handler to create new game:
  const handleStartNewGame = $(async () => {
    try {
      boardLoading.value = true;
      const g = await createGame(player.value!.id, null);
      game.value = g;
      gameError.value = null;
      spectatorMode.value = false;
    } catch (e: any) {
      gameError.value = e.message;
    } finally {
      boardLoading.value = false;
    }
  });

  // Handler to join existing game as Player O
  const handleJoinGame = $(async (gameId: number) => {
    try {
      boardLoading.value = true;
      const g = await joinGame(gameId, player.value!.username);
      game.value = g;
      gameError.value = null;
      spectatorMode.value = false;
    } catch (e: any) {
      gameError.value = e.message;
    } finally {
      boardLoading.value = false;
    }
  });

  // Handler for episodic game polling for realtime updates
  const pollGame = $(async () => {
    if (!game.value) return;
    try {
      const updated = await getGame(game.value.id);
      game.value = updated;
    } catch {
      // ignore
    }
  });

  // Poll every 2 seconds - simple polling for real-time updates (no WebSocket)
  if (typeof window !== "undefined" && game.value && !game.value.finished_at) {
    setTimeout(() => {
      pollGame();
    }, 2000);
  }

  // Handler for when a board move is made
  const onMove = $(() => {
    // Always refetch soon after a move for real-time effect
    setTimeout(() => pollGame(), 600);
  });

  // Handler to replay a past game
  const onReplayRequested = $(async (gameId: number) => {
    try {
      const hist = await getGameHistory(gameId);
      replayHistory.value = hist;
      replayMoveIdx.value = 0;
      spectatorMode.value = true;
      // set board to starting pos
      game.value = hist.game;
    } catch {
      gameError.value = "Failed to load replay";
    }
  });

  // Handler to step through replay
  const nextReplay = $(() => {
    if (
      replayHistory.value &&
      replayMoveIdx.value < replayHistory.value.moves.length
    ) {
      const next = replayHistory.value.moves[replayMoveIdx.value];
      // Apply move to board
      const b = replayHistory.value.game.board.map((r) => [...r]);
      b[next.x][next.y] = next.symbol;
      game.value = {
        ...game.value!,
        board: b,
        next_turn:
          next.symbol === "X"
            ? "O"
            : "X",
      };
      replayMoveIdx.value += 1;
    }
  });

  // Handler to end replay mode
  const exitReplay = $(() => {
    replayHistory.value = null;
    replayMoveIdx.value = 0;
    spectatorMode.value = false;
    // Optionally restore last game or clear
  });

  // Render main UI
  return (
    <div class="rootdark" style="min-height:100vh;">
      <div class="centermain">
        <div class="topbar">
          <div class="playerinfo">
            <span>
              Logged in as: <b>{player.value.username}</b>
            </span>
            {game.value && (
              <>
                {" "}
                | You are:{" "}
                {player.value.id === game.value.player_x.id ? (
                  <span class="rolex">X</span>
                ) : player.value.id === game.value.player_o?.id ? (
                  <span class="roleo">O</span>
                ) : (
                  "Spectator"
                )}
              </>
            )}
          </div>
          <button class="logoutbtn"
            onClick$={() => {
              localStorage.removeItem("player_id");
              localStorage.removeItem("username");
              player.value = null;
            }}>
            Logout
          </button>
        </div>

        {/* Game Board/Card */}
        <div class="game-panel">
          {game.value ? (
            <div>
              <div class="game-status">
                {game.value.winner ? (
                  game.value.winner === "Draw" ? (
                    <span class="draw-ann">Draw!</span>
                  ) : (
                    <span class="winner-ann">Winner: {game.value.winner}</span>
                  )
                ) : game.value.next_turn ? (
                  <span>
                    Turn:{" "}
                    {game.value.next_turn === "X" ? (
                      <span class="rolex">X</span>
                    ) : (
                      <span class="roleo">O</span>
                    )}
                  </span>
                ) : (
                  <span>It's your game!</span>
                )}
              </div>
              <Board
                game={game.value}
                currentPlayer={player.value}
                onMove={onMove}
                isSpectator={spectatorMode.value || (
                  player.value.id !== game.value.player_x.id &&
                  player.value.id !== game.value.player_o?.id
                )}
                disabled={boardLoading.value || replayHistory.value !== null}
              />
              {gameError.value && (
                <div class="err">{gameError.value}</div>
              )}
            </div>
          ) : (
            <div class="no-game">
              <span>Start a new game or join from history below.</span>
            </div>
          )}
        </div>

        <div class="controls-row">
          <button class="ctrlbtn" onClick$={handleStartNewGame} disabled={boardLoading.value}>
            New Game
          </button>
          <button
            class="ctrlbtn"
            onClick$={() => {
              if (game.value) pollGame();
            }}
            disabled={!game.value}
            style="margin-left:0.5em;"
          >
            Refresh
          </button>
          {game.value && !game.value.player_o && player.value.id !== (game.value?.player_x.id ?? -1) && (
            <button class="ctrlbtn joinbtn" onClick$={() => handleJoinGame(game.value!.id)}>
              Join (as O)
            </button>
          )}
          {replayHistory.value && (
            <>
              <button class="ctrlbtn" onClick$={nextReplay}>
                Next Move
              </button>
              <button class="ctrlbtn" style="margin-left:0.5em;" onClick$={exitReplay}>
                Exit Replay
              </button>
            </>
          )}
        </div>

        {/* Game History View */}
        <HistoryView onReplayRequested={onReplayRequested} />
      </div>
      {/* Styles */}
      <style>
        {`
          .centermain {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 0 auto;
            min-height: 98vh;
            background: var(--background-color, #12182b);
            padding-bottom: 3em;
          }
          .topbar {
            width:100%;
            display:flex;
            justify-content:space-between;
            align-items:center;
            padding:1.2em 0.2em 0.2em 0.2em;
            color:var(--secondary-color);
          }
          .logoutbtn {
            background: #2d3553;
            color: #ffc107;
            padding: 0.44em 1.6em;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
            margin-left: 2em;
          }
          .playerinfo {font-size: 1.13em;}
          .rolex {
            color: var(--primary-color, #1976d2);
            font-weight: bold;
            padding: 0 .3em;
          }
          .roleo {
            color: var(--accent-color, #ffc107);
            font-weight: bold;
            padding: 0 .3em;
          }
          .controls-row {
            margin: 1.6em 0 0 0;
            display: flex;
            gap: 1.2em;
            justify-content: center;
            width: 100%;
          }
          .ctrlbtn {
            background: var(--tile-bg, #262c3a);
            color: var(--secondary-color, #fff);
            border: 1.5px solid #284b7a;
            border-radius: 7px;
            padding: 0.83em 2em;
            font-size: 1.04em;
            cursor: pointer;
            margin-bottom: 0.2em;
          }
          .ctrlbtn.joinbtn {background: #228399;}
          .ctrlbtn:disabled{opacity:0.5;cursor:not-allowed;}
          .game-panel {
            background: var(--background-color2,#222e3d);
            padding:2em 1.8em 2em 1.8em;
            border-radius:14px;
            margin-top: 2.7em;
            box-shadow:0px 2px 40px #02052730;
            max-width:420px;
            margin-bottom:1.4em;
            width:98vw;
          }
          .game-status, .no-game {
            color:var(--secondary-color,#fff);
            text-align: center;
            font-size: 1.24em;
            margin-bottom: 1.1em;
          }
          .winner-ann {color:#FFC107;font-size:1.23em;}
          .draw-ann {color:#79dd82;font-size:1.1em;}
          .err {color:#ffc107;text-align:center;margin-top:0.9em;}
          @media(max-width:600px) {
            .game-panel{padding:0.6em;}
            .centermain{padding-bottom:0.3em;}
          }
        `}
      </style>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Tic Tac Toe Qwik",
  meta: [
    {
      name: "description",
      content: "Play multiplayer Tic Tac Toe online. Realtime board, join games, review history.",
    },
  ],
};
