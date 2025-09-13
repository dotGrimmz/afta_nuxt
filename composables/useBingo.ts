import type { Database } from "~/types/supabase";

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
  ): Promise<void> => {
    console.log("payout in start game call function in composable", payout);
    try {
      const { game } = await $fetch(`/api/bingo/games/${gameId}/start`, {
        method: "POST",
        body: { payout },
      });

      console.log("game from:", game);
      const gameNarrow = narrowGame(game);

      // update local state with returned game
      games.value = (games.value ?? []).map((g) =>
        g.id === gameNarrow.id ? gameNarrow : g
      );

      await refresh();
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
    console.log("data from get state, should have winners array", data);
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
      const { contestant, code, cards } = await $fetch(
        `/api/bingo/games/${gameId}/add-contestant`,
        {
          method: "POST",
          body: { username, numCards, freeSpace, autoMark, contestantId },
        }
      );

      //@ts-ignore
      return { contestant, code, cards };
    } catch (err: any) {
      console.error("Failed to issue join code:", err);
    }
  };

  const getContestants = async (gameId: string) => {
    const { data, error } = await supabase
      .from("bingo_contestants")
      .select("id, username, num_cards, code")
      .eq("game_id", gameId);

    await refresh();

    if (error) {
      console.error("Failed to fetch contestants:", error.message);
    }

    return data;
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
      console.log({ response });
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

  return {
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
  } satisfies UseBingo;
};
