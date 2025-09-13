import type { Database } from "~/types/supabase";

/** ── DB row aliases (exactly as Supabase generates) ───────────────────────── */
export type BaseGameRow = Database["public"]["Tables"]["bingo_games"]["Row"];

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
// export type CandidateType = BingoCandidateRow;

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
  winners: any[];
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

export type DashboardGameState = {
  game: BingoGameRow | null;
  draws: number[];
  candidates: BingoCard[];
  contestants: BingoContestantRow[];
  loading: boolean;
};

// Add this client-normalized state (numbers instead of draw rows)
export type ClientGameState = {
  game: BingoGameRow | undefined | null;
  draws: number[];
  winners?: BingoCard[]; // winnerCandidates normalized
  candidates: BingoCard[];
  contestants: BingoContestantRow[];
};

// (optional) response when adding a contestant / issuing a join code
export type IssueJoinCodeResponse = {
  contestant: BingoContestantRow;
  code: JoinCode | "";
  cards: BingoCard[];
};

// The interface your composable will return
import type { Ref } from "vue";

export interface UseBingo {
  games?: Ref<BingoGameRow[]>; // non-null (we’ll set a default)
  loading: Ref<boolean>;
  creating: Ref<boolean>;
  message: Ref<string>;

  refresh: () => Promise<void>;

  createGame: () => Promise<BingoGameRow | undefined>;
  startGame: (
    gameId: string,
    payout: number | string | undefined
  ) => Promise<void>;
  stopGame: (gameId: string) => Promise<{ game: BingoGameRow } | undefined>;

  drawNumber: (gameId: string) => Promise<{ draw: BingoDrawRow } | undefined>;

  confirmWinner: (
    gameId: string,
    cardId: string,
    contestantId: string,
    payout: number
  ) => Promise<unknown>; // adjust if you have a typed response

  joinGame: (code: string) => Promise<IssueJoinCodeResponse | undefined>;

  // NOTE: client-normalized state (numbers), not server wire type
  getState: (gameId: string) => Promise<ClientGameState>;

  issueJoinCode: (
    gameId: string,
    username: string,
    numCards: number,
    freeSpace: boolean,
    autoMark: boolean
  ) => Promise<IssueJoinCodeResponse | undefined>;

  getContestants: (gameId: string) => Promise<Array<{
    id: string;
    username: string;
    num_cards: number;
    code: string;
  }> | null>;

  callBingo: (
    gameId: string,
    cardId: string,
    contestantId: string,
    username?: string | null,
    payout?: string | number
  ) => Promise<CallBingoResponse>;
  narrowGame: (row: BaseGameRow) => BingoGameRow;
  loadGame: () => Promise<BingoGameRow | undefined | null>;
}
