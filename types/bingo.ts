import type { Database } from "~/types/supabase";

// The interface your composable will return
import type { ComputedRef, Ref } from "vue";

/** ── DB row aliases (exactly as Supabase generates) ───────────────────────── */
export type BaseGameRow = Database["public"]["Tables"]["bingo_games"]["Row"];

export type GameMode = "classic" | "strategy";

export type BingoGameRow = Omit<BaseGameRow, "status" | "mode"> & {
  status: GameStatus;
  mode: GameMode;

  payout?: number | null;
  winner_id?: string | null;
  winner_username?: string | null;
};

export type GameStatus = "lobby" | "active" | "ended";

export type BingoContestantRow =
  Database["public"]["Tables"]["bingo_contestants"]["Row"];
export type BingoCardRow = Database["public"]["Tables"]["bingo_cards"]["Row"];
export type BingoDrawRow = Database["public"]["Tables"]["bingo_draws"]["Row"];
export type BingoRoundRow =
  Database["public"]["Tables"]["bingo_rounds"]["Row"];
export type BingoResultRow =
  Database["public"]["Tables"]["bingo_results"]["Row"] & {
    username: string;
  };
export type BingoScoreRow =
  Database["public"]["Tables"]["bingo_scores"]["Row"];
export type StrategyScoreHistoryRow = BingoScoreRow & {
  contestant?: Pick<
    Database["public"]["Tables"]["bingo_contestants"]["Row"],
    "username" | "code" | "user_id"
  > | null;
};
export type StrategyLeaderboardEntry = {
  contestantId: string;
  username: string | null;
  code: string | null;
  totalPoints: number;
  lastScoreId: string;
  lastRoundId: string | null;
  lastUpdate: string;
  position: number | null;
  metadata: Database["public"]["Tables"]["bingo_scores"]["Row"]["metadata"];
};
export type StrategyScoreFilters = {
  eventId?: string;
  gameId?: string;
  limit?: number;
};
export type StrategyBadgeMap = Record<
  string,
  {
    rank: number;
    points: number;
  }
>;
export type StrategyScorePayload = {
  eventId: string;
  contestantId: string;
  pointsAwarded: number;
  gameId?: string | null;
  roundId?: string | null;
  position?: number | null;
  metadata?: Database["public"]["Tables"]["bingo_scores"]["Row"]["metadata"];
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

export type LobbyPresence = {
  user_id: string;
  username: string;
  ready: boolean;
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

export type DashboardControllerOptions = {
  onResult?: (result: BingoResultRow) => void;
  strategySource?: StrategyScoreFilters;
  onStrategyScore?: (score: StrategyScoreHistoryRow) => void;
};

export type DashboardController = {
  state: DashboardGameState;
  players: Ref<LobbyPresence[]>;
  allReady: ComputedRef<boolean>;
  recentResults: Ref<any[]>;
  recentResultsLoading: Ref<boolean>;
  recentResultsPage: Ref<number>;
  recentResultsPageSize: Ref<number>;
  recentResultsTotal: Ref<number>;
  hydrate: (gameId: string) => Promise<void>;
  refresh: (gameId: string) => Promise<void>;
  loadLatestGame: () => Promise<BingoGameRow | undefined>;
  fetchRecentResults: (page?: number) => Promise<void>;
  strategyHistory: Ref<StrategyScoreHistoryRow[]>;
  strategyLeaderboard: Ref<StrategyLeaderboardEntry[]>;
  strategyScoresLoading: Ref<boolean>;
  fetchStrategyScores: (filters?: StrategyScoreFilters) => Promise<void>;
  setStrategySource: (filters?: StrategyScoreFilters) => Promise<void>;
  subscribe: (gameId: string) => void;
  unsubscribe: () => void;
  removeContestant: (contestantId: string) => Promise<void>;
  findGameCode: (profileId: string | undefined) => string | undefined;
  totalContestantCards: ComputedRef<number>;
};

export interface UseBingo {
  games?: Ref<BingoGameRow[]>; // non-null (we’ll set a default)
  loading: Ref<boolean>;
  creating: Ref<boolean>;
  message: Ref<string>;

  refresh: () => Promise<void>;

  createGame: (mode?: GameMode) => Promise<BingoGameRow | undefined>;
  startGame: (
    gameId: string,
    payout: number | string | undefined
  ) => Promise<BingoGameRow | undefined>;
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

  getContestants: (gameId: string) => Promise<BingoContestantRow[] | null>;

  callBingo: (
    gameId: string,
    cardId: string,
    contestantId: string,
    username?: string | null,
    payout?: string | number
  ) => Promise<CallBingoResponse>;
  recordStrategyScore: (
    payload: StrategyScorePayload
  ) => Promise<BingoScoreRow | undefined>;
  getStrategyScores: (
    filters: StrategyScoreFilters
  ) => Promise<{
    history: StrategyScoreHistoryRow[];
    leaderboard: StrategyLeaderboardEntry[];
  } | null>;
  narrowGame: (row: BaseGameRow) => BingoGameRow;
  loadGame: () => Promise<BingoGameRow | undefined>;
  createDashboardController: (
    options?: DashboardControllerOptions
  ) => DashboardController;
}
