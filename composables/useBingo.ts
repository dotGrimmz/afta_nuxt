import { computed, reactive, ref } from "vue";
import type { Database } from "~/types/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

import type {
  GameStateResponse,
  ContestantType,
  BingoCard,
  BingoGameRow,
  BingoDrawRow,
  BingoRoundRow,
  JoinGameResponse,
  CallBingoResponse,
  UseBingo,
  BaseGameRow,
  GameStatus,
  GameMode,
  ClientGameState,
  IssueJoinCodeResponse,
  BingoContestantRow,
  DashboardController,
  DashboardControllerOptions,
  DashboardGameState,
  LobbyPresence,
  BingoScoreRow,
  StrategyLeaderboardEntry,
  StrategyScoreFilters,
  StrategyScoreHistoryRow,
  StrategyScorePayload,
  StrategyBonusRules,
} from "~/types/bingo";

const STRATEGY_MAX_DRAWS = 75;

export const useBingo = (): UseBingo => {
  const supabase = useSupabaseClient<Database>();
  const narrowGame = (row: BaseGameRow): BingoGameRow => {
    // compile-time narrowing; no runtime check per your preference
    return {
      ...row,
      status: row.status as GameStatus,
      mode: (row.mode as GameMode) ?? "classic",
    } as BingoGameRow;
  };
  // Hydrated list of games
  const {
    data: games,
    pending: loading,
    refresh,
  } = useAsyncData<BingoGameRow[]>("bingo-games", async () => {
    const { data, error } = await supabase
      .from("bingo_games")
      .select("*")
      .neq("status", "ended")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(narrowGame);
  });

  const creating = ref(false);
  const message = ref("");

  const createGame = async (
    mode: GameMode = "classic",
    strategyPoints?: {
      first?: number;
      second?: number;
      third?: number;
      requiredWinners?: number;
      totalRounds?: number;
      drawLimitMode?: "unlimited" | "limited";
      drawLimitValue?: number;
      bonusRules?: StrategyBonusRules;
    }
  ): Promise<BingoGameRow | undefined> => {
    creating.value = true;
    try {
      const drawLimitEnabled = strategyPoints?.drawLimitMode === "limited";
      const rawLimit = strategyPoints?.drawLimitValue ?? null;
      const normalizedLimit =
        drawLimitEnabled && typeof rawLimit === "number"
          ? Math.max(30, Math.min(rawLimit, STRATEGY_MAX_DRAWS))
          : null;
      const effectiveLimit = drawLimitEnabled
        ? normalizedLimit ?? 30
        : STRATEGY_MAX_DRAWS;

      const { data, error } = await supabase
        .from("bingo_games")
        .insert({
          status: "lobby",
          mode,
          strategy_first_place_points: strategyPoints?.first,
          strategy_second_place_points: strategyPoints?.second,
          strategy_third_place_points: strategyPoints?.third,
          strategy_required_winners: strategyPoints?.requiredWinners,
          total_rounds: strategyPoints?.totalRounds,
          strategy_draw_limit_enabled: drawLimitEnabled,
          strategy_draw_limit: drawLimitEnabled ? effectiveLimit : null,
          strategy_draws_per_round: effectiveLimit,
          strategy_bonus_rules: strategyPoints?.bonusRules,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const created = narrowGame(data);
        message.value = "Bingo game created!";
        await refresh();
        return created as BingoGameRow;
      }
    } catch (err: any) {
      console.error(err);
      message.value = err.message;
    } finally {
      creating.value = false;
    }
  };

  const startGame = async (
    gameId: string,
    payout: number | undefined | string
  ): Promise<BingoGameRow | undefined> => {
    try {
      const { game } = await $fetch(`/api/bingo/games/${gameId}/start`, {
        method: "POST",
        body: { payout },
      });

      const gameNarrow = narrowGame(game);
      await refresh();

      return gameNarrow;
    } catch (err: any) {
      console.error("Failed to start bingo game:", err);
      message.value = err.message;
    }
  };

  const stopGame = async (
    gameId: string
  ): Promise<{ game: BingoGameRow } | undefined> => {
    try {
      const data = await $fetch<{
        game: BingoGameRow;
      }>(`/api/bingo/games/${gameId}/stop`, {
        method: "POST",
      });

      message.value = "Game stopped.";
      await refresh();
      return data;
    } catch (err: any) {
      console.error(err);
      message.value = err.message;
    }
  };

  const drawNumber = async (
    gameId: string
  ): Promise<{ draw: BingoDrawRow } | undefined> => {
    try {
      const data = await $fetch<{
        draw: BingoDrawRow;
      }>(`/api/bingo/games/${gameId}/draw`, {
        method: "POST",
      });

      return data;
    } catch (err: any) {
      console.error(err);
      message.value = err.message;
    }
  };

  const confirmWinner = async (
    gameId: string,
    cardId: string,
    contestantId: string,
    payout: number
  ) => {
    try {
      return await $fetch(`/api/bingo/games/${gameId}/winner`, {
        method: "POST",
        body: { cardId, contestantId, payout },
      });
    } catch (err: any) {
      console.error("Failed to confirm winner:", err);
      throw err;
    }
  };
  const joinGame = async (
    code: string
  ): Promise<IssueJoinCodeResponse | undefined> => {
    try {
      const { contestant, cards } = await $fetch<JoinGameResponse>(
        `/api/bingo/contestants/${code}/join`
      );
      return { contestant, cards: cards, code } as IssueJoinCodeResponse;
    } catch (e: any) {
      message.value = e.message;
    }
  };

  /**
   * Fetch current game state (draws + winner candidates)
   */
  const getState = async (gameId: string): Promise<ClientGameState> => {
    const data = await $fetch<GameStateResponse>(
      `/api/bingo/games/${gameId}/state`
    );
    return {
      game: narrowGame(data.game),
      draws: data.draws.map((d: { number: any }) => d.number),
      winners: data.winnerCandidates,
      candidates: data.candidates,
      contestants: data.contestants,
    };
  };

  //   const joinGame = async (
  //   code: string
  // ): Promise<IssueJoinCodeResponse | undefined> => {
  const issueJoinCode = async (
    gameId: string,
    username: string,
    numCards: number,
    freeSpace: boolean,
    autoMark: boolean,
    contestantId?: string | undefined
  ): Promise<IssueJoinCodeResponse | undefined> => {
    try {
      const { contestant, code, cards } = await $fetch<{
        contestant: BingoContestantRow;
        code: string;
        cards: BingoCard[];
      }>(
        `/api/bingo/games/${gameId}/add-contestant`,
        {
          method: "POST",
          body: { username, numCards, freeSpace, autoMark, contestantId },
        }
      );

      return { contestant, code, cards } as IssueJoinCodeResponse;
    } catch (err: any) {
      console.error("Failed to issue join code:", err);
    }
  };

  const getContestants = async (
    gameId: string
  ): Promise<BingoContestantRow[] | null> => {
    const { data, error } = await supabase
      .from("bingo_contestants")
      .select("*")
      .eq("game_id", gameId);

    if (error) {
      console.error("Failed to fetch contestants:", error.message);
    }

    return data ?? [];
  };

  const callBingo = async (
    gameId: string,
    cardId: string,
    contestantId: string,
    username?: string | null,
    payout?: string | number
  ) => {
    try {
      const response = await $fetch(`/api/bingo/games/${gameId}/call-bingo`, {
        method: "POST",
        body: { cardId, contestantId, username, payout },
      });
      return response as CallBingoResponse;
    } catch (err: any) {
      console.error("Failed to call bingo:", err);
      throw err;
    }
  };

  const getStrategyScores = async (
    filters: StrategyScoreFilters
  ): Promise<{
    history: StrategyScoreHistoryRow[];
    leaderboard: StrategyLeaderboardEntry[];
  } | null> => {
    if (!filters.eventId && !filters.gameId) {
      console.warn(
        "[getStrategyScores] eventId or gameId is required to fetch scores."
      );
      return null;
    }

    try {
      return await $fetch<{
        history: StrategyScoreHistoryRow[];
        leaderboard: StrategyLeaderboardEntry[];
      }>("/api/bingo/strategy/scores", {
        query: {
          ...(filters.eventId ? { eventId: filters.eventId } : {}),
          ...(filters.gameId ? { gameId: filters.gameId } : {}),
          ...(filters.limit ? { limit: filters.limit } : {}),
        },
      });
    } catch (err) {
      console.error("Failed to fetch strategy scores:", err);
      return null;
    }
  };

  const recordStrategyScore = async (
    payload: StrategyScorePayload
  ): Promise<BingoScoreRow | undefined> => {
    try {
      const { score } = await $fetch<{ score: BingoScoreRow }>(
        "/api/bingo/strategy/scores",
        {
          method: "POST",
          body: payload,
        }
      );

      return score;
    } catch (err) {
      console.error("Failed to record strategy score:", err);
      throw err;
    }
  };
  const startStrategyAutomation = async (gameId: string) => {
    try {
      await $fetch(`/api/bingo/games/${gameId}/strategy/start`, {
        method: "POST",
      });
      message.value = "Strategy automation started.";
    } catch (err: any) {
      console.error("Failed to start strategy automation:", err);
      throw err;
    }
  };

  const loadGame = async (): Promise<BingoGameRow | undefined> => {
    try {
      const { data } = await supabase
        .from("bingo_games")
        .select("*")
        .in("status", ["lobby", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<BaseGameRow>();
      return data ? narrowGame(data) : undefined;
    } catch (e: any) {
      console.error({ e });
      message.value = e.message;
    }
  };

  const createDashboardController = (
    options?: DashboardControllerOptions
  ): DashboardController => {
    const state = reactive<DashboardGameState>({
      game: null,
      draws: [],
      candidates: [],
      contestants: [],
      loading: false,
    });

    const players = ref<LobbyPresence[]>([]);
    const allReady = computed(
      () =>
        players.value.length > 0 &&
        players.value.every((p) => p.ready === true)
    );

    const recentResults = ref<any[]>([]);
    const recentResultsLoading = ref(true);
    const recentResultsPage = ref(1);
    const recentResultsPageSize = ref(10);
    const recentResultsTotal = ref(0);

    const strategyHistory = ref<StrategyScoreHistoryRow[]>([]);
    const strategyLeaderboard = ref<StrategyLeaderboardEntry[]>([]);
    const strategyScoresLoading = ref(false);
    const strategyRounds = ref<BingoRoundRow[]>([]);
    const strategyRoundsLoading = ref(false);
    const strategySource = reactive<StrategyScoreFilters>({
      eventId: options?.strategySource?.eventId,
      gameId: options?.strategySource?.gameId,
      limit: options?.strategySource?.limit ?? 200,
    });

    const totalContestantCards = computed(() =>
      state.contestants.reduce(
        (total, contestant) => total + (contestant.num_cards ?? 0),
        0
      )
    );

    const channels: Record<string, RealtimeChannel> = {};
    let lobbyChannel: RealtimeChannel | null = null;

    const fetchRecentResults = async (page = recentResultsPage.value) => {
      recentResultsLoading.value = true;
      try {
        const response = await $fetch<{ data: any[]; total: number; page: number; pageSize: number }>(
          "/api/bingo/results/recent",
          {
            query: {
              page,
              pageSize: recentResultsPageSize.value,
            },
          }
        );

        recentResults.value = response?.data ?? [];
        recentResultsTotal.value = response?.total ?? recentResults.value.length;
        if (typeof response?.page === "number") {
          recentResultsPage.value = response.page;
        }
        if (
          typeof response?.pageSize === "number" &&
          response.pageSize !== recentResultsPageSize.value
        ) {
          recentResultsPageSize.value = response.pageSize;
        }
      } catch (err) {
        console.error("Failed to fetch results", err);
      } finally {
        recentResultsLoading.value = false;
      }
    };

    const fetchStrategyScores = async (
      filters: StrategyScoreFilters = strategySource
    ) => {
      if (!filters.eventId && !filters.gameId) {
        strategyHistory.value = [];
        strategyLeaderboard.value = [];
        return;
      }

      strategyScoresLoading.value = true;
      try {
        const data = await getStrategyScores(filters);
        if (!data) return;
        strategyHistory.value = data.history ?? [];
        strategyLeaderboard.value = data.leaderboard ?? [];
      } catch (err) {
        console.error("Failed to fetch strategy scores:", err);
      } finally {
        strategyScoresLoading.value = false;
      }
    };

    const fetchStrategyRounds = async (gameId?: string) => {
      const targetGameId = gameId ?? state.game?.id;
      if (!targetGameId) return;
      strategyRoundsLoading.value = true;
      try {
        const data = await $fetch<{
          rounds: BingoRoundRow[];
        }>(`/api/bingo/games/${targetGameId}/strategy/state`);
        strategyRounds.value = data.rounds ?? [];
      } catch (err) {
        console.error("Failed to fetch strategy rounds:", err);
      } finally {
        strategyRoundsLoading.value = false;
      }
    };

    const removeStrategyChannel = () => {
      if (channels.strategyScores) {
        supabase.removeChannel(channels.strategyScores);
        delete channels.strategyScores;
      }
    };

    const subscribeToStrategyScores = (filters: StrategyScoreFilters) => {
      removeStrategyChannel();

      const filterClause = filters.eventId
        ? `event_id=eq.${filters.eventId}`
        : filters.gameId
        ? `game_id=eq.${filters.gameId}`
        : null;

      if (!filterClause) return;

      channels.strategyScores = supabase
        .channel(`bingo_scores_${filters.eventId ?? filters.gameId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bingo_scores",
            filter: filterClause,
          },
          async (payload) => {
            const inserted = payload.new as StrategyScoreHistoryRow;
            if (options?.onStrategyScore) {
              options.onStrategyScore(inserted);
            }
            await fetchStrategyScores(filters);
          }
        )
        .subscribe();
    };

    const setStrategySource = async (filters?: StrategyScoreFilters) => {
      strategySource.eventId = filters?.eventId;
      strategySource.gameId = filters?.gameId;
      strategySource.limit = filters?.limit ?? strategySource.limit;

      if (!strategySource.eventId && !strategySource.gameId) {
        removeStrategyChannel();
        strategyHistory.value = [];
        strategyLeaderboard.value = [];
        return;
      }

      await fetchStrategyScores(strategySource);
      subscribeToStrategyScores(strategySource);
    };
    const subscribeToStrategyRounds = (gameId: string) => {
      if (channels.strategyRounds) return;
      channels.strategyRounds = supabase
        .channel(`bingo_rounds_${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bingo_rounds",
            filter: `game_id=eq.${gameId}`,
          },
          async () => {
            await fetchStrategyRounds(gameId);
          }
        )
        .subscribe();
    };

    const applyState = (data: ClientGameState) => {
      if (!data.game) return;
      state.game = data.game;
      state.draws.splice(0, state.draws.length, ...data.draws);
      state.candidates.splice(0, state.candidates.length, ...data.candidates);
      state.contestants.splice(
        0,
        state.contestants.length,
        ...data.contestants
      );
      if (data.game.mode === "strategy") {
        fetchStrategyRounds(data.game.id);
      } else {
        strategyRounds.value = [];
      }
    };

    const hydrate = async (gameId: string) => {
      state.loading = true;
      try {
        const data = await getState(gameId);
        applyState(data);
      } finally {
        state.loading = false;
      }
    };

    const refreshState = async (gameId: string) => {
      state.loading = true;
      try {
        const data = await getState(gameId);
        applyState(data);
      } finally {
        state.loading = false;
      }
    };

    const subscribeToContestants = (gameId: string) => {
      if (channels.contestants) return;
      channels.contestants = supabase
        .channel(`bingo_contestants_${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bingo_contestants",
            filter: `game_id=eq.${gameId}`,
          },
          (payload) => {
            const contestant = payload.new as ContestantType;
            state.contestants = [...state.contestants, contestant];
          }
        )
        .subscribe();
    };

    const subscribeToResults = (gameId: string) => {
      if (channels.results) return;
      channels.results = supabase
        .channel(`bingo_results_${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bingo_results",
            filter: `game_id=eq.${gameId}`,
          },
          async (payload) => {
            const confirmed = payload?.new as BingoResultRow;
            if (options?.onResult) {
              options.onResult(confirmed);
            }
            await fetchRecentResults();
          }
        )
        .subscribe();
    };

    const subscribeToGame = (gameId: string) => {
      if (channels.game) return;
      channels.game = supabase
        .channel(`bingo_games_${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "bingo_games",
            filter: `id=eq.${gameId}`,
          },
          (payload) => {
            const updated = payload.new as BingoGameRow;
            state.game = narrowGame(updated);
          }
        )
        .subscribe();
    };

    const subscribeToDraws = (gameId: string) => {
      if (channels.draws) return;
      channels.draws = supabase
        .channel(`bingo_draws_${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bingo_draws",
            filter: `game_id=eq.${gameId}`,
          },
          (payload) => {
            const row =
              payload.new as Database["public"]["Tables"]["bingo_draws"]["Row"];
            if (!state.draws.includes(row.number)) {
              state.draws.push(row.number);
            }
          }
        )
        .subscribe();
    };

    const setupLobbyChannel = (gameId: string) => {
      if (lobbyChannel) {
        supabase.removeChannel(lobbyChannel);
        lobbyChannel = null;
      }
      lobbyChannel = supabase.channel(`lobby:${gameId}`, {
        config: { presence: {} },
      });
      lobbyChannel
        .on("presence", { event: "sync" }, () => {
          const stateMap = lobbyChannel!.presenceState();
          const entries = Object.values(stateMap) as Array<any>;
          const flat = entries.flat() as Array<LobbyPresence>;
          players.value = flat.map((entry) => ({
            user_id: String(entry.user_id),
            username: entry.username,
            ready: !!entry.ready,
          }));
        })
        .subscribe();
    };

    const subscribe = (gameId: string) => {
      subscribeToGame(gameId);
      subscribeToDraws(gameId);
      subscribeToContestants(gameId);
      subscribeToResults(gameId);
      if (state.game?.mode === "strategy") {
        subscribeToStrategyRounds(gameId);
        fetchStrategyRounds(gameId);
      }
      setupLobbyChannel(gameId);
    };

    const unsubscribe = () => {
      Object.values(channels).forEach((ch) => supabase.removeChannel(ch));
      for (const key of Object.keys(channels)) {
        Reflect.deleteProperty(channels, key);
      }
      if (lobbyChannel) {
        supabase.removeChannel(lobbyChannel);
        lobbyChannel = null;
      }
    };

    const loadLatestGame = async (): Promise<BingoGameRow | undefined> => {
      const game = await loadGame();
      if (!game) return undefined;
      state.game = game;
      await hydrate(game.id);
      return game;
    };

    const removeContestant = async (contestantId: string) => {
      const gameId = state.game?.id;
      if (!gameId) return;
      try {
        await supabase
          .from("bingo_cards")
          .delete()
          .eq("contestant_id", contestantId)
          .eq("game_id", gameId);

        await supabase
          .from("bingo_contestants")
          .delete()
          .eq("id", contestantId)
          .eq("game_id", gameId);

        const updatedContestants = await getContestants(gameId);
        if (!updatedContestants) return;
        state.contestants = updatedContestants;
      } catch (err) {
        console.error("Error removing contestant:", err);
      }
    };

    const findGameCode = (profileId: string | undefined) => {
      if (!profileId) return;
      const contestant = state.contestants.find(
        (entry) => entry.user_id === profileId
      );
      return contestant?.code ?? undefined;
    };

    if (strategySource.eventId || strategySource.gameId) {
      setStrategySource({ ...strategySource });
    } else if (options?.strategySource) {
      setStrategySource(options.strategySource);
    }

    return {
      state,
      players,
      allReady,
      recentResults,
      recentResultsLoading,
      recentResultsPage,
      recentResultsPageSize,
      recentResultsTotal,
      hydrate,
      refresh: refreshState,
      loadLatestGame,
      fetchRecentResults,
      strategyHistory,
      strategyLeaderboard,
      strategyScoresLoading,
      strategyRounds,
      strategyRoundsLoading,
      fetchStrategyScores,
      setStrategySource,
      fetchStrategyRounds,
      startStrategyAutomation,
      subscribe,
      unsubscribe,
      removeContestant,
      findGameCode,
      totalContestantCards,
    };
  };

  return {
    games,
    loading,
    creating,
    message,
    refresh,
    createGame,
    startGame,
    stopGame,
    drawNumber,
    confirmWinner,
    joinGame,
    issueJoinCode,
    getContestants,
  callBingo,
  recordStrategyScore,
  getStrategyScores,
  startStrategyAutomation,
  narrowGame,
  getState,

    loadGame,
    createDashboardController,
  } satisfies UseBingo;
};
