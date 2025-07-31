//
// API client for backend communication for player, games, moves, and history
//
const API_URL = "http://localhost:3001";

export type Player = {
  id: number;
  username: string;
};

export type Game = {
  id: number;
  player_x: Player;
  player_o: Player | null;
  board: Array<Array<"X" | "O" | null>>;
  next_turn: "X" | "O" | null;
  winner: "X" | "O" | "Draw" | null;
  created_at: string;
  finished_at: string | null;
};

export type Move = {
  id: number;
  game_id: number;
  player: Player;
  x: number;
  y: number;
  symbol: "X" | "O";
  timestamp: string;
};

export type GameHistory = {
  game: Game;
  moves: Move[];
};

// PUBLIC_INTERFACE
export async function createPlayer(username: string): Promise<Player> {
  const resp = await fetch(`${API_URL}/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!resp.ok) throw new Error("Failed to create player");
  return await resp.json();
}

// PUBLIC_INTERFACE
export async function getPlayer(player_id: number): Promise<Player> {
  const resp = await fetch(`${API_URL}/players/${player_id}`);
  if (!resp.ok) throw new Error("Player not found");
  return await resp.json();
}

// PUBLIC_INTERFACE
export async function createGame(player_x_id: number, player_o_id: number | null = null): Promise<Game> {
  const resp = await fetch(`${API_URL}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_x_id, player_o_id }),
  });
  if (!resp.ok) throw new Error("Unable to create game");
  return await resp.json();
}

// PUBLIC_INTERFACE
export async function joinGame(game_id: number, username: string): Promise<Game> {
  const resp = await fetch(`${API_URL}/games/${game_id}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!resp.ok) throw new Error("Unable to join game");
  return await resp.json();
}

// PUBLIC_INTERFACE
export async function listGames(limit = 20): Promise<Game[]> {
  const resp = await fetch(`${API_URL}/games?limit=${limit}`);
  if (!resp.ok) throw new Error("Could not load games");
  return await resp.json();
}

// PUBLIC_INTERFACE
export async function getGame(game_id: number): Promise<Game> {
  const resp = await fetch(`${API_URL}/games/${game_id}`);
  if (!resp.ok) throw new Error("Game not found");
  return await resp.json();
}

// PUBLIC_INTERFACE
export async function submitMove(
  game_id: number,
  player_id: number,
  x: number,
  y: number
): Promise<Move> {
  const resp = await fetch(`${API_URL}/games/${game_id}/moves`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_id, x, y }),
  });
  if (!resp.ok) throw new Error("Invalid move or error on move");
  return await resp.json();
}

// PUBLIC_INTERFACE
export async function getGameHistory(game_id: number): Promise<GameHistory> {
  const resp = await fetch(`${API_URL}/games/${game_id}/history`);
  if (!resp.ok) throw new Error("Game history not found");
  return await resp.json();
}
