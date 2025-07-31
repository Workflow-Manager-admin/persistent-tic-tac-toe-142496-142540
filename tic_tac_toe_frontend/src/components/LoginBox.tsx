import { component$, useSignal, $ } from "@builder.io/qwik";
import { createPlayer } from "./api";
import type { Player } from "./api";

type Props = {
  onLogin: (player: Player) => void;
};

// PUBLIC_INTERFACE
export const LoginBox = component$<Props>(({ onLogin }) => {
  const username = useSignal("");
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const successfulPlayer = useSignal<Player | null>(null);

  // Load from localStorage if exists on mount
  if (typeof window !== "undefined") {
    const savedId = localStorage.getItem("player_id");
    const savedName = localStorage.getItem("username");
    if (savedId && savedName) {
      setTimeout(() => onLogin({ id: parseInt(savedId), username: savedName }), 0);
    }
  }

  // Effect: call onLogin OUTSIDE serialization scope after a successful submit
  if (successfulPlayer.value) {
    onLogin(successfulPlayer.value);
    successfulPlayer.value = null;
  }

  // PUBLIC_INTERFACE
  const submitLogin = $(async () => {
    loading.value = true;
    error.value = null;
    try {
      const player = await createPlayer(username.value.trim());
      localStorage.setItem("player_id", player.id.toString());
      localStorage.setItem("username", player.username);
      successfulPlayer.value = player; // flag for synchronous onLogin
    } catch (e: any) {
      error.value = e.message || "Login failed";
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="login-box">
      <h2>Welcome to Tic Tac Toe</h2>
      <input
        value={username.value}
        onInput$={(e) =>
          (username.value = (e.target as HTMLInputElement).value)
        }
        placeholder="Enter your username"
        disabled={loading.value}
      />
      <button
        onClick$={submitLogin}
        disabled={loading.value || !username.value.trim()}
        style="margin-top:1em;"
      >
        {loading.value ? "Logging in..." : "Login"}
      </button>
      {error.value && <div class="error">{error.value}</div>}
      <style>
        {`
        .login-box {
          background: var(--tile-bg, #262c3a);
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 24px #1117  ;
          max-width: 350px;
          margin: 10vh auto;
          text-align: center;
          color: var(--secondary-color, #fff);
        }
        input {
          padding: 0.75em 0.5em;
          border-radius: 6px;
          font-size: 1.1em;
          width: 180px;
          margin-right: 0.5em;
          border: none;
          margin-bottom: 1em;
        }
        input:disabled {
          background: #384257;
        }
        button {
          background: var(--primary-color, #1976d2);
          color: var(--secondary-color, #fff);
          border: none;
          border-radius: 6px;
          padding: 0.85em 2em;
          font-size: 1.1em;
          cursor: pointer;
          
        }
        .error {
          color: #ffc107;
          font-size: 0.85em;
          margin-top: 0.6em;
        }
      `}
      </style>
    </div>
  );
});
