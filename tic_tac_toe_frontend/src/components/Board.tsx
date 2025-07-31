import { component$, $, useSignal } from "@builder.io/qwik";
import { submitMove } from "./api";
import type { Game, Player } from "./api";

type BoardProps = {
  game: Game;
  currentPlayer: Player;
  onMove: (moveSuccess: boolean) => void;
  isSpectator: boolean;
  disabled?: boolean;
};

// PUBLIC_INTERFACE
export const Board = component$<BoardProps>(
  ({ game, currentPlayer, onMove, isSpectator, disabled }) => {
    const errorMsg = useSignal<string | null>(null);
    const moveResult = useSignal<boolean | null>(null);
    // Calculate which symbol represents this player
    const playerSymbol =
      currentPlayer.id === game.player_x.id
        ? "X"
        : game.player_o && currentPlayer.id === game.player_o.id
        ? "O"
        : null;

    // Effect: signal handler to call parent callback outside Qwik serialization
    if (moveResult.value !== null) {
      onMove(moveResult.value);
      moveResult.value = null;
    }

    const handleClick = $((row: number, col: number) => {
      if (
        disabled ||
        game.winner ||
        game.board[row][col] !== null ||
        !playerSymbol ||
        game.next_turn !== playerSymbol ||
        isSpectator
      ) {
        return;
      }
      errorMsg.value = null;
      submitMove(game.id, currentPlayer.id, row, col)
        .then(() => {
          moveResult.value = true;
        })
        .catch(() => {
          errorMsg.value = "Invalid move!";
          moveResult.value = false;
        });
    });

    return (
      <div>
        <div class="game-board">
          {game.board.map((row, ridx) => (
            <div class="board-row" key={ridx}>
              {row.map((cell, cidx) => (
                <button
                  key={`${ridx}-${cidx}`}
                  class={"cell" + (cell ? " occupied" : "")}
                  onClick$={() => handleClick(ridx, cidx)}
                  disabled={
                    disabled ||
                    !!cell ||
                    !!game.winner ||
                    !playerSymbol ||
                    game.next_turn !== playerSymbol ||
                    isSpectator
                  }
                >
                  {cell === "X" ? (
                    <span class="xcell">X</span>
                  ) : cell === "O" ? (
                    <span class="ocell">O</span>
                  ) : (
                    ""
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
        {errorMsg.value && <div class="errormsg">{errorMsg.value}</div>}
        <style>
          {`
            .game-board {
              display: grid;
              gap: 0.5em;
              background-color: var(--background-color2, #222e3d);
              padding: 1.2em;
              border-radius: 13px;
              box-shadow: 0 2px 16px #121a  ;
              margin-bottom: 0.5em;
              width: min-content;
              margin-left:auto;
              margin-right:auto;
            }
            .board-row {
              display: flex;
            }
            .cell {
              width: 70px;
              height: 70px;
              background: var(--tile-bg, #1c2533);
              border: 2.3px solid #445;
              margin: 0.18em;
              border-radius: 8px;
              font-size: 2.55em;
              font-weight: bold;
              color: var(--secondary-color, #fff);
              cursor: pointer;
              transition: background 0.1s;
              position: relative;
              box-shadow: 0 2px 8px #1119;
            }
            .cell:disabled {
              opacity: 0.7;
              background: #152130;
              cursor: not-allowed;
            }
            .xcell {
              color: var(--primary-color, #1976d2);
              font-weight: 900;
              letter-spacing: 0.07em;
              text-shadow: 0 2px 8px #09337a70;
            }
            .ocell {
              color: var(--accent-color, #ffc107);
              font-weight: 900;
              text-shadow: 0 1.5px 6px #7b6c2050;
            }
            .cell.occupied {
              border-color: #384866;
            }
            .errormsg {
              color: #FFC107;
              margin-top: 0.9em;
              font-size: 1.2em;
              text-align: center;
            }
            @media(max-width:520px) {
              .cell {width:39px;height:39px;font-size:1.35em;}
              .game-board {padding:0.5em;}
            }
          `}
        </style>
      </div>
    );
  }
);
