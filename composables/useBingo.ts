import type { Database } from "~/types/supabase";

type BingoGame = Database["public"]["Tables"]["bingo_games"]["Row"];
type BingoContestant = Database["public"]["Tables"]["bingo_contestants"]["Row"];
type BingoDraw = Database["public"]["Tables"]["bingo_draws"]["Row"];
type BingoResult = Database["public"]["Tables"]["bingo_results"]["Row"];
type ContestantType =
  Database["public"]["Tables"]["bingo_contestants"]["Row"][];
import type { _BingoCardType } from "~/types/bingo";

export const useBingo = () => {
  const supabase = useSupabaseClient<Database>();

  // Hydrated list of games
  const {
    data: games,
    pending: loading,
    refresh,
  } = useAsyncData("bingo-games", async () => {
    const { data, error } = await supabase
      .from("bingo_games")
      .select("*")
      .neq("status", "ended")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data ?? [];
  });

  const creating = ref(false);
  const message = ref("");

  const createGame = async (): Promise<BingoGame | undefined> => {
    creating.value = true;
    try {
      const { data, error } = await supabase
        .from("bingo_games")
        .insert({
          status: "lobby",
          min_players: 2,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        message.value = "Bingo game created!";
        await refresh();
        return data as BingoGame;
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

      // update local state with returned game
      games.value = (games.value ?? []).map((g) =>
        g.id === game.id ? game : g
      );
      await refresh();
    } catch (err: any) {
      console.error("Failed to start bingo game:", err);
      message.value = err.message;
    }
  };

  const stopGame = async (
    gameId: string
  ): Promise<
    { game: BingoGame; winnerCandidates: _BingoCardType[] } | undefined
  > => {
    try {
      const data = await $fetch<{
        game: BingoGame;
        winnerCandidates: _BingoCardType[];
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
  ): Promise<{ draw: BingoDraw; winners: _BingoCardType[] } | undefined> => {
    try {
      const data = await $fetch<{
        draw: BingoDraw;
        winners: _BingoCardType[];
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

  const joinGame = async (code: string) => {
    try {
      const { contestant, cards } = await $fetch(
        `/api/bingo/contestants/${code}/join`
      );

      return {
        contestant: contestant as BingoContestant,
        cards: (cards || []) as _BingoCardType[], // 👈 cast here once
      };
    } catch (err: any) {
      console.error(err);
      message.value = err.message;
      return { contestant: null, cards: [] as _BingoCardType[] };
    }
  };

  /**
   * Fetch current game state (draws + winner candidates)
   */
  const getState = async (
    gameId: string
  ): Promise<{
    draws: number[];
    winners: _BingoCardType[];
    candidates: _BingoCardType[];
    contestants: ContestantType[];
    game?: any;
  }> => {
    try {
      const data = await $fetch<{
        draws: { number: number }[];
        winnerCandidates: _BingoCardType[];
        candidates: _BingoCardType[];
        contestants: ContestantType[];
      }>(`/api/bingo/games/${gameId}/state`);
      console.log("data from api", data);
      return {
        game: data,
        draws: data.draws.map((d) => d.number), // always new array
        winners: [...data.winnerCandidates],
        contestants: [...(data.contestants ?? [])],
        candidates: [...(data.candidates ?? [])],
      };
    } catch (err: any) {
      console.error(err);
      message.value = err.message;
      return { draws: [], winners: [], candidates: [], contestants: [] }; // 👈 backward compatible + safe
    }
  };

  const issueJoinCode = async (
    gameId: string,
    username: string,
    numCards: number,
    freeSpace: boolean,
    autoMark: boolean
  ) => {
    try {
      const { contestant, code, cards } = await $fetch(
        `/api/bingo/games/${gameId}/add-contestant`,
        {
          method: "POST",
          body: { username, numCards, freeSpace, autoMark },
        }
      );

      return { contestant, code, cards };
    } catch (err: any) {
      console.error("Failed to issue join code:", err);
      throw err;
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
      return response;
    } catch (err: any) {
      console.error("Failed to call bingo:", err);
      throw err;
    }
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
    getState,
    issueJoinCode,
    getContestants,
    callBingo,
  };
};
