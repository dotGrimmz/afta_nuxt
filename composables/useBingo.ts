import type { Database } from "~/types/supabase";

type BingoGame = Database["public"]["Tables"]["bingo_games"]["Row"];
type BingoContestant = Database["public"]["Tables"]["bingo_contestants"]["Row"];
type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];
type BingoDraw = Database["public"]["Tables"]["bingo_draws"]["Row"];
type BingoResult = Database["public"]["Tables"]["bingo_results"]["Row"];

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

  const startGame = async (gameId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("bingo_games")
        .update({ status: "active" })
        .eq("id", gameId);

      if (error) {
        throw error;
      }

      await refresh();
    } catch (err: any) {
      console.error(err);
      message.value = err.message;
    }
  };

  const stopGame = async (
    gameId: string
  ): Promise<
    { game: BingoGame; winnerCandidates: BingoCard[] } | undefined
  > => {
    try {
      const data = await $fetch<{
        game: BingoGame;
        winnerCandidates: BingoCard[];
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
  ): Promise<{ draw: BingoDraw; winners: BingoCard[] } | undefined> => {
    try {
      const data = await $fetch<{
        draw: BingoDraw;
        winners: BingoCard[];
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
  ): Promise<BingoResult | undefined> => {
    try {
      const data = await $fetch<{
        result: BingoResult;
      }>(`/api/bingo/games/${gameId}/winner`, {
        method: "POST",
        body: { cardId, contestantId, payout },
      });

      message.value = "Winner confirmed!";
      return data.result;
    } catch (err: any) {
      console.error(err);
      message.value = err.message;
    }
  };

  const joinGame = async (
    code: string
  ): Promise<
    { contestant: BingoContestant; cards: BingoCard[] } | undefined
  > => {
    try {
      const data = await $fetch<{
        contestant: BingoContestant;
        cards: BingoCard[];
      }>(`/api/bingo/contestants/${code}/join`);

      return {
        contestant: data.contestant,
        cards: data.cards,
      };
    } catch (err: any) {
      console.error(err);
      message.value = err.message;
    }
  };

  /**
   * Fetch current game state (draws + winner candidates)
   */
  const getState = async (
    gameId: string
  ): Promise<{ draws: number[]; winners: BingoCard[] }> => {
    try {
      const data = await $fetch<{
        draws: { number: number }[];
        winnerCandidates: BingoCard[];
      }>(`/api/bingo/games/${gameId}/state`);

      return {
        draws: data.draws.map((d) => d.number),
        winners: data.winnerCandidates,
      };
    } catch (err: any) {
      console.error(err);
      message.value = err.message;
      return { draws: [], winners: [] }; // 👈 always safe return
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
    getState, // 👈 new helper
  };
};
