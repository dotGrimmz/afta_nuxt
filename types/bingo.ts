import type { Database } from "~/types/supabase";

/** ── DB row aliases (exactly as Supabase generates) ───────────────────────── */
type BaseGameRow = Database["public"]["Tables"]["bingo_games"]["Row"];

export type BingoGameRow = Omit<BaseGameRow, "status"> & {
  status: GameStatus;

  payout?: number | null;
  winner_id?: string | null;
  winner_username?: string | null;
};

export type GameStatus = "lobby" | "active" | "ended";

export type BingoContestantRow =
  Database["public"]["Tables"]["bingo_contestants"]["Row"];
export type BingoCardRow = Database["public"]["Tables"]["bingo_cards"]["Row"];
export type BingoDrawRow = Database["public"]["Tables"]["bingo_draws"]["Row"];
export type BingoResultRow =
  Database["public"]["Tables"]["bingo_results"]["Row"] & {
    username: string;
  };
/** ── Grid shape used in-app ───────────────────────────────────────────────── */
export type BingoCardGrid = {
  numbers: number[][];
  marked: boolean[][];
};

/** Strongly-typed card (parsed grid). If Supabase types `grid` as Json,
 * you may need a small cast when constructing this type. */
export type BingoCard = Omit<BingoCardRow, "grid"> & { grid: BingoCardGrid };

/** Singular contestant row (use BingoContestantRow[] for lists). */
export type ContestantType = BingoContestantRow;

/** ── Realtime payload aliases (INSERT/UPDATE rows) ────────────────────────── */
export type RTDrawInsert = BingoDrawRow;
export type RTGameUpdate = BingoGameRow;
export type RTResultInsert = BingoResultRow;
export type RTContestantInsert = BingoContestantRow;

export type GameStateResponse = {
  game: BingoGameRow;
  draws: BingoDrawRow[];
  contestants: BingoContestantRow[];
  winnerCandidates: BingoCard[];
  candidates: BingoCard[];
};

export type FourChars = `${string}${string}${string}${string}`;
// (TS can’t enforce A–Z/0–9 at compile time, but this narrows the shape)
export type JoinCode = `BINGO-${FourChars}`;

export type JoinGameResponse = {
  contestant: BingoContestantRow;
  cards: BingoCard[];
  code?: JoinCode; // server returns it; client may ignore it
};

/** Response shape for POST /api/bingo/games/[gameId]/call-bingo */
export type CallBingoResponse = {
  message: string;
  result: BingoResultRow; // has: id, payout, contestant_id, game_id, card_id, won_at
  game: Pick<
    BingoGameRow,
    "status" | "created_at" | "ended_at" | "id" | "min_players"
  >;
};
