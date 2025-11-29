import { createError } from "h3";
import type {
  PostgrestSingleResponse,
  RealtimeChannel,
} from "@supabase/supabase-js";
import { serverSupabase } from "../utils/supabase";
import {
  awardStrategyPoints,
  type StrategyBonusDescriptor,
} from "./strategyAwards";
import { detectStrategyPatternBonuses } from "~/utils/bingo/patterns";
import { generateBingoCard } from "~/utils/bingo/generateCard";
import type {
  BingoGameRow,
  BingoRoundRow,
  StrategyBonusRules,
} from "~/types/bingo";
import type { Database, Json } from "~/types/supabase";

type StrategyControllerState = {
  initialized: boolean;
  activeRoundNumber: number | null;
  timer: NodeJS.Timeout | null;
  intermissionTimer: NodeJS.Timeout | null;
  shuttingDown: boolean;
};

type StrategyGameConfig = Pick<
  BingoGameRow,
  | "id"
  | "mode"
  | "status"
  | "payout"
  | "min_players"
  | "total_rounds"
  | "strategy_draw_interval_seconds"
  | "strategy_draws_per_round"
  | "strategy_intermission_seconds"
  | "strategy_first_place_points"
  | "strategy_second_place_points"
  | "strategy_third_place_points"
  | "strategy_required_winners"
  | "strategy_draw_limit_enabled"
  | "strategy_draw_limit"
  | "strategy_bonus_rules"
> & { event_id: string | null };

const controllerStates = new Map<string, StrategyControllerState>();
const MAX_STRATEGY_DRAWS = 75;
const STRATEGY_AUTO_RESTART_DELAY_MS = 8000;
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const DEFAULT_BONUS_RULES: StrategyBonusRules = {
  patterns: {
    fourCorners: { points: 5, label: "Four Corners" },
    x: { points: 15, label: "X Pattern" },
  },
  combo: {
    points: 10,
    window: 1,
    label: "Back-to-back",
  },
};

/**
 * Central manager for Strategy Bingo automation.
 * Handles round creation, draw cadence, scoring, and champion selection.
 */
class StrategyController {
  private gameId: string;
  private state: StrategyControllerState;
  private config: StrategyGameConfig | null = null;
  private roundRealtime: RealtimeChannel | null = null;
  private winnersThisRound = new Set<string>();
  private activeRoundId: string | null = null;

  constructor(gameId: string) {
    this.gameId = gameId;
    this.state = {
      initialized: false,
      activeRoundNumber: null,
      timer: null,
      intermissionTimer: null,
      shuttingDown: false,
    };
    controllerStates.set(gameId, this.state);
  }

  async start(): Promise<void> {
    if (this.state.initialized) {
      console.info(`[Strategy] Game ${this.gameId} already initialized.`);
      return;
    }

    this.config = await this.fetchGameConfig();
    if (this.config.mode !== "strategy") {
      throw createError({
        statusCode: 400,
        statusMessage: "Game is not in strategy mode.",
      });
    }

    await this.ensureRoundsExist(this.config);
    await this.prepareRealtimeSubscriptions();
    this.state.initialized = true;
    this.state.shuttingDown = false;
    console.info(`[Strategy] Game ${this.gameId} controller initialized.`);
    await this.startNextRound();
  }

  async stop(reason = "manual-stop"): Promise<void> {
    this.state.shuttingDown = true;
    if (this.state.timer) {
      clearTimeout(this.state.timer);
      this.state.timer = null;
    }
    if (this.state.intermissionTimer) {
      clearTimeout(this.state.intermissionTimer);
      this.state.intermissionTimer = null;
    }

    if (this.roundRealtime) {
      serverSupabase.removeChannel(this.roundRealtime);
      this.roundRealtime = null;
    }
    this.winnersThisRound.clear();
    controllerStates.delete(this.gameId);
    console.info(
      `[Strategy] Game ${this.gameId} controller stopped. (${reason})`
    );
  }

  private async fetchGameConfig(): Promise<StrategyGameConfig> {
    const { data, error }: PostgrestSingleResponse<any> = await serverSupabase
      .from("bingo_games")
      .select(
        "id, mode, status, payout, min_players, total_rounds, strategy_draw_interval_seconds, strategy_draws_per_round, strategy_intermission_seconds, strategy_first_place_points, strategy_second_place_points, strategy_third_place_points, strategy_required_winners, strategy_draw_limit_enabled, strategy_draw_limit, strategy_bonus_rules, bingo_events(id)"
      )
      .eq("id", this.gameId)
      .maybeSingle();

    if (error || !data) {
      throw createError({
        statusCode: 404,
        statusMessage: error?.message ?? "Game not found",
      });
    }

    const eventRelation = Array.isArray(data.bingo_events)
      ? data.bingo_events[0]
      : data.bingo_events;

    const drawLimitEnabled = data.strategy_draw_limit_enabled ?? false;
    const effectiveDrawsPerRound = drawLimitEnabled
      ? data.strategy_draw_limit ??
        data.strategy_draws_per_round ??
        MAX_STRATEGY_DRAWS
      : MAX_STRATEGY_DRAWS;

    return {
      ...data,
      strategy_draws_per_round: effectiveDrawsPerRound,
      strategy_bonus_rules:
        (data.strategy_bonus_rules as StrategyBonusRules | null) ??
        DEFAULT_BONUS_RULES,
      event_id: eventRelation?.id ?? null,
    } as StrategyGameConfig;
  }

  private async ensureRoundsExist(config: StrategyGameConfig): Promise<void> {
    const { data, error } = await serverSupabase
      .from("bingo_rounds")
      .select("id, round_number")
      .eq("game_id", this.gameId);

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }

    const existingRounds = new Set(
      (data ?? []).map((row: { round_number: number }) => row.round_number)
    );
    const inserts: Omit<
      Database["public"]["Tables"]["bingo_rounds"]["Insert"],
      "id"
    >[] = [];
    for (let i = 1; i <= config.total_rounds; i++) {
      if (existingRounds.has(i)) continue;
      inserts.push({
        game_id: this.gameId,
        round_number: i,
        draws_per_round: config.strategy_draws_per_round,
        draw_interval_seconds: config.strategy_draw_interval_seconds,
        status: "pending",
      });
    }
    if (inserts.length) {
      await serverSupabase.from("bingo_rounds").insert(inserts);
    }
  }

  private async prepareRealtimeSubscriptions() {
    if (this.roundRealtime) {
      serverSupabase.removeChannel(this.roundRealtime);
      this.roundRealtime = null;
    }

    this.roundRealtime = serverSupabase
      .channel(`strategy_scores_${this.gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bingo_results",
          filter: `game_id=eq.${this.gameId}`,
        },
        (payload) => {
          const row = payload.new as Database["public"]["Tables"]["bingo_results"]["Row"];
          if (!row.contestant_id) return;
          this.handleBingoWin(row.contestant_id, {
            cardId: row.card_id ?? null,
          });
        }
      )
      .subscribe();
  }

  private async startNextRound(): Promise<void> {
    if (this.state.shuttingDown) return;
    const nextRound = await this.fetchNextPendingRound();
    if (!nextRound) {
      console.info(`[Strategy] Game ${this.gameId} has no pending rounds.`);
      await this.handleChampionSelection();
      return;
    }

    this.winnersThisRound.clear();
    this.state.activeRoundNumber = nextRound.round_number;
    this.activeRoundId = nextRound.id;
    await this.markRoundActive(nextRound.id);
    console.info(
      `[Strategy] Game ${this.gameId} starting round ${nextRound.round_number}`
    );
    this.scheduleDrawLoop(nextRound);
  }

  private scheduleDrawLoop(round: BingoRoundRow) {
    let drawsExecuted = 0;
    const limitEnabled = this.config?.strategy_draw_limit_enabled ?? false;
    const maxDraws = limitEnabled
      ? round.draws_per_round
      : MAX_STRATEGY_DRAWS;
    const intervalMs = round.draw_interval_seconds * 1000;
    this.winnersThisRound.clear();

    const loop = async () => {
      if (this.state.shuttingDown) return;
      if (drawsExecuted >= maxDraws) {
        await this.finishRound(round.id);
        return;
      }

      drawsExecuted++;
      try {
        await this.performStrategyDraw();
      } catch (err) {
        console.error("[Strategy] draw error", err);
      } finally {
        this.state.timer = setTimeout(loop, intervalMs);
      }
    };

    this.state.timer = setTimeout(loop, intervalMs);
  }

  private async performStrategyDraw() {
    console.info(`[Strategy] Performing automated draw for game ${this.gameId}`);
    const { data: draws, error: drawsError } = await serverSupabase
      .from("bingo_draws")
      .select("number")
      .eq("game_id", this.gameId);

    if (drawsError) {
      throw drawsError;
    }

    const drawnNumbers = (draws ?? []).map((d) => d.number);
    const pool = Array.from({ length: 75 }, (_, i) => i + 1).filter(
      (n) => !drawnNumbers.includes(n)
    );

    if (!pool.length) {
      console.warn("[Strategy] All numbers drawn, skipping.");
      return;
    }

    const number = pool[Math.floor(Math.random() * pool.length)];
    await serverSupabase.from("bingo_draws").insert({
      game_id: this.gameId,
      number,
      draw_order: drawnNumbers.length + 1,
    });

    await this.evaluateAutoWinners();
  }

  private async evaluateAutoWinners() {
    const { data, error } = await serverSupabase
      .from("bingo_cards")
      .select("id, contestant_id, grid")
      .eq("game_id", this.gameId)
      .eq("is_winner_candidate", true);

    if (error || !data) return;

    for (const row of data) {
      if (row.contestant_id) {
        await this.handleBingoWin(row.contestant_id, {
          cardId: row.id,
          cardGrid: row.grid as Json,
        });
      }
    }
  }

  private async finishRound(roundId: string) {
    console.info(`[Strategy] Round ${roundId} completed for ${this.gameId}`);
    if (this.state.timer) {
      clearTimeout(this.state.timer);
      this.state.timer = null;
    }
    this.activeRoundId = null;
    this.state.activeRoundNumber = null;
    this.winnersThisRound.clear();
    const intermissionMs =
      (this.config?.strategy_intermission_seconds ?? 10) * 1000;

    await serverSupabase
      .from("bingo_rounds")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        intermission_ends_at: new Date(Date.now() + intermissionMs).toISOString(),
      })
      .eq("id", roundId);

    this.state.intermissionTimer = setTimeout(
      () => this.startNextRound(),
      intermissionMs
    );
  }

  private async fetchNextPendingRound(): Promise<BingoRoundRow | null> {
    const { data } = await serverSupabase
      .from("bingo_rounds")
      .select("*")
      .eq("game_id", this.gameId)
      .eq("status", "pending")
      .order("round_number", { ascending: true })
      .limit(1)
      .maybeSingle();

    return (data as BingoRoundRow | null) ?? null;
  }

  private async markRoundActive(roundId: string) {
    await serverSupabase
      .from("bingo_rounds")
      .update({
        status: "active",
        started_at: new Date().toISOString(),
        intermission_ends_at: null,
        ended_at: null,
      })
      .eq("id", roundId);
  }

  private async handleChampionSelection() {
    console.info(`[Strategy] Champion selection pending for ${this.gameId}`);
    const { data, error } = await serverSupabase
      .from("bingo_scores")
      .select("contestant_id, total_after_round")
      .eq("game_id", this.gameId)
      .order("total_after_round", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[Strategy] Failed to aggregate scores:", error.message);
      return;
    }

    const champion = data?.[0];
    if (!champion) {
      console.info("[Strategy] No champion found (no scores).");
      return;
    }

    const championContestant =
      champion.contestant_id &&
      (
        await serverSupabase
          .from("bingo_contestants")
          .select("username")
          .eq("id", champion.contestant_id)
          .maybeSingle()
      ).data;

    await serverSupabase.from("bingo_results").insert({
      game_id: this.gameId,
      contestant_id: champion.contestant_id,
      payout: 0,
      username:
        championContestant?.username ?? champion.contestant_id ?? "",
    });

    await serverSupabase
      .from("bingo_games")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("id", this.gameId);

    await this.autoRestartGame();
    await this.stop("strategy-cycle-complete");
  }

  private async autoRestartGame(): Promise<void> {
    if (!this.config) return;
    try {
      if (STRATEGY_AUTO_RESTART_DELAY_MS > 0) {
        await sleep(STRATEGY_AUTO_RESTART_DELAY_MS);
      }
      const nextGame = await this.createNextGameFromConfig();
      if (!nextGame) return;

      await this.syncEventReference(nextGame.id);
      await this.transferContestantsToNextGame(nextGame.id);
      console.info(
        `[Strategy] Game ${this.gameId} auto-restarted as ${nextGame.id}`
      );
    } catch (err) {
      console.error(
        `[Strategy] Failed to auto restart game ${this.gameId}`,
        err
      );
    }
  }

  private async createNextGameFromConfig(): Promise<BingoGameRow | null> {
    if (!this.config) return null;
    const winnerTarget = Math.max(
      this.config.strategy_required_winners ?? 0,
      this.resolvePlacementWinnerTarget()
    );
    const payload: Partial<BingoGameRow> = {
      status: "lobby",
      mode: "strategy",
      payout: this.config.payout ?? 0,
      min_players: this.config.min_players ?? 0,
      total_rounds: this.config.total_rounds ?? 5,
      strategy_draw_interval_seconds:
        this.config.strategy_draw_interval_seconds ?? 3,
      strategy_draws_per_round:
        this.config.strategy_draws_per_round ?? MAX_STRATEGY_DRAWS,
      strategy_intermission_seconds:
        this.config.strategy_intermission_seconds ?? 10,
      strategy_first_place_points: this.config.strategy_first_place_points ?? 0,
      strategy_second_place_points:
        this.config.strategy_second_place_points ?? 0,
      strategy_third_place_points: this.config.strategy_third_place_points ?? 0,
      strategy_required_winners: winnerTarget > 0 ? winnerTarget : 1,
      strategy_draw_limit_enabled:
        this.config.strategy_draw_limit_enabled ?? false,
      strategy_draw_limit: this.config.strategy_draw_limit,
      strategy_bonus_rules:
        this.config.strategy_bonus_rules ?? DEFAULT_BONUS_RULES,
      winner_id: null,
      winner_username: null,
      ended_at: null,
    };

    const { data, error } = await serverSupabase
      .from("bingo_games")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      console.error(
        `[Strategy] Unable to create next game for ${this.gameId}:`,
        error?.message
      );
      return null;
    }

    return data as BingoGameRow;
  }

  private async syncEventReference(nextGameId: string): Promise<void> {
    if (!this.config?.event_id) return;
    try {
      await serverSupabase
        .from("bingo_events")
        .update({ game_id: nextGameId })
        .eq("id", this.config.event_id);
    } catch (err) {
      console.error(
        `[Strategy] Failed to relink event ${this.config.event_id} to ${nextGameId}`,
        err
      );
    }
  }

  private async transferContestantsToNextGame(
    nextGameId: string
  ): Promise<void> {
    const { data: contestants, error: contestantsError } = await serverSupabase
      .from("bingo_contestants")
      .select("id, num_cards")
      .eq("game_id", this.gameId);

    if (contestantsError) {
      console.error(
        `[Strategy] Failed to load contestants for restart:`,
        contestantsError.message
      );
      return;
    }

    if (!contestants?.length) {
      console.info(
        `[Strategy] No contestants to migrate for game ${this.gameId}`
      );
      return;
    }

    const { data: cardPrefs, error: cardPrefError } = await serverSupabase
      .from("bingo_cards")
      .select("contestant_id, free_space, auto_mark_enabled")
      .eq("game_id", this.gameId);

    if (cardPrefError) {
      console.error(
        `[Strategy] Failed to load card preferences for restart:`,
        cardPrefError.message
      );
    }

    const preferenceMap = new Map<
      string,
      { freeSpace: boolean; autoMark: boolean }
    >();
    for (const card of cardPrefs ?? []) {
      if (!card.contestant_id || preferenceMap.has(card.contestant_id))
        continue;
      preferenceMap.set(card.contestant_id, {
        freeSpace: !!card.free_space,
        autoMark: !!card.auto_mark_enabled,
      });
    }

    for (const contestant of contestants) {
      try {
        const pref =
          preferenceMap.get(contestant.id) ?? {
            freeSpace: false,
            autoMark: false,
          };
        const cardTotal = Math.max(contestant.num_cards ?? 1, 1);
        const inserts = [];

        for (let i = 0; i < cardTotal; i++) {
          const grid = generateBingoCard(pref.freeSpace);
          inserts.push({
            game_id: nextGameId,
            contestant_id: contestant.id,
            grid,
            free_space: pref.freeSpace,
            auto_mark_enabled: pref.autoMark,
            is_winner_candidate: false,
          });
        }

        if (inserts.length) {
          await serverSupabase.from("bingo_cards").insert(inserts);
        }

        await serverSupabase
          .from("bingo_contestants")
          .update({
            game_id: nextGameId,
            joined_at: new Date().toISOString(),
          })
          .eq("id", contestant.id);
      } catch (err) {
        console.error(
          `[Strategy] Failed to migrate contestant ${contestant.id} to ${nextGameId}`,
          err
        );
      }
    }
  }

  private resolvePlacementWinnerTarget(): number {
    if (!this.config) return 1;
    const placements = [
      this.config.strategy_first_place_points ?? 0,
      this.config.strategy_second_place_points ?? 0,
      this.config.strategy_third_place_points ?? 0,
    ].filter((value) => typeof value === "number" && value > 0).length;
    return Math.max(placements, 1);
  }

  private async handleBingoWin(
    contestantId: string,
    context?: { cardId?: string | null; cardGrid?: Json | null }
  ) {
    if (!this.config || !this.state.activeRoundNumber) return;
    if (this.winnersThisRound.has(contestantId)) return;

    this.winnersThisRound.add(contestantId);
    const order = this.winnersThisRound.size;

    let points = 0;
    if (order === 1) points = this.config.strategy_first_place_points;
    else if (order === 2) points = this.config.strategy_second_place_points;
    else if (order === 3) points = this.config.strategy_third_place_points;

    if (points <= 0) return;

    const { data: round } = await serverSupabase
      .from("bingo_rounds")
      .select("id")
      .eq("game_id", this.gameId)
      .eq("round_number", this.state.activeRoundNumber)
      .single();

    const draws = await this.fetchDrawNumbers();
    const cardGrid = await this.loadWinningCardGrid(contestantId, context);
    const patternMatches =
      cardGrid && draws.length
        ? detectStrategyPatternBonuses(
            { grid: cardGrid, draws },
            this.config.strategy_bonus_rules
          )
        : [];
    const comboBonus = await this.computeComboBonus(contestantId);

    await awardStrategyPoints({
      gameId: this.gameId,
      eventId: this.config.event_id ?? this.gameId,
      roundId: round?.id ?? null,
      contestantId,
      basePoints: points,
      placementOrder: order,
      source: "auto",
      patternMatches,
      bonusDescriptors: comboBonus ? [comboBonus] : [],
    });

    const requiredTarget = Math.max(
      this.config.strategy_required_winners ?? 0,
      this.resolvePlacementWinnerTarget()
    );
    const required = requiredTarget > 0 ? requiredTarget : 1;
    if (this.winnersThisRound.size >= required && this.activeRoundId) {
      await this.finishRound(this.activeRoundId);
    }
  }

  private async fetchDrawNumbers(): Promise<number[]> {
    const { data, error } = await serverSupabase
      .from("bingo_draws")
      .select("number")
      .eq("game_id", this.gameId);

    if (error) {
      console.error("[Strategy] Failed to load draws:", error.message);
      return [];
    }

    return (data ?? []).map((row) => row.number);
  }

  private async loadWinningCardGrid(
    contestantId: string,
    context?: { cardId?: string | null; cardGrid?: Json | null }
  ): Promise<Json | null> {
    if (context?.cardGrid) return context.cardGrid;

    if (context?.cardId) {
      const { data } = await serverSupabase
        .from("bingo_cards")
        .select("grid")
        .eq("id", context.cardId)
        .maybeSingle();
      return (data?.grid as Json) ?? null;
    }

    const { data } = await serverSupabase
      .from("bingo_cards")
      .select("grid")
      .eq("game_id", this.gameId)
      .eq("contestant_id", contestantId)
      .eq("is_winner_candidate", true)
      .limit(1)
      .maybeSingle();

    return (data?.grid as Json) ?? null;
  }

  private async computeComboBonus(
    contestantId: string
  ): Promise<StrategyBonusDescriptor | null> {
    if (!this.config?.strategy_bonus_rules?.combo) return null;
    const comboRule = this.config.strategy_bonus_rules.combo;
    if (!comboRule || comboRule.points <= 0) return null;
    if (!this.state.activeRoundNumber) return null;

    const { data: lastScore } = await serverSupabase
      .from("bingo_scores")
      .select("round_id")
      .eq("game_id", this.gameId)
      .eq("contestant_id", contestantId)
      .eq("is_bonus", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastScore?.round_id) return null;

    const { data: lastRound } = await serverSupabase
      .from("bingo_rounds")
      .select("round_number")
      .eq("id", lastScore.round_id)
      .maybeSingle();

    if (!lastRound?.round_number) return null;

    const window = comboRule.window ?? 1;
    const diff = this.state.activeRoundNumber - lastRound.round_number;
    if (diff <= 0 || diff > window) return null;

    return {
      type: "combo",
      id: "combo",
      label: comboRule.label ?? "Combo Bonus",
      points: comboRule.points,
    };
  }
}

const controllers = new Map<string, StrategyController>();

const getController = (gameId: string): StrategyController => {
  let controller = controllers.get(gameId);
  if (!controller) {
    controller = new StrategyController(gameId);
    controllers.set(gameId, controller);
  }
  return controller;
};

export const startStrategyAutomation = async (gameId: string) => {
  const controller = getController(gameId);
  await controller.start();
};

export const stopStrategyAutomation = async (gameId: string, reason?: string) => {
  const controller = controllers.get(gameId);
  if (!controller) return;
  await controller.stop(reason);
  controllers.delete(gameId);
};

export const getStrategyAutomationState = (gameId: string) =>
  controllerStates.get(gameId);
