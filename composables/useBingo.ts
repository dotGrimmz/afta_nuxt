import { computed, reactive, ref } from "vue";
import type { Database } from "~/types/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

import type {
  GameStateResponse,
  ContestantType,
  BingoCard,
  BingoGameRow,
  BingoDrawRow,
  JoinGameResponse,
  CallBingoResponse,
  UseBingo,
  BaseGameRow,
  GameStatus,
  ClientGameState,
  IssueJoinCodeResponse,
  BingoContestantRow,
  DashboardController,
  DashboardControllerOptions,
  DashboardGameState,
  LobbyPresence,
} from "~/types/bingo";

export const useBingo = (): UseBingo => {
  const supabase = useSupabaseClient<Database>();
  const narrowGame = (row: BaseGameRow): BingoGameRow => {
    // compile-time narrowing; no runtime check per your preference
    return { ...row, status: row.status as GameStatus } as BingoGameRow;
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

  const createGame = async (): Promise<BingoGameRow | undefined> => {
    creating.value = true;
    try {
      const { data, error } = await supabase
        .from("bingo_games")
        .insert({
          status: "lobby",
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
    narrowGame,
    getState,

    loadGame,
    createDashboardController,
  } satisfies UseBingo;
};
