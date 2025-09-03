import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

type BingoGame = Database["public"]["Tables"]["bingo_games"]["Row"];
type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];

export default defineEventHandler(async (event) => {
  const gameId = event.context.params?.gameId;
  const client = await serverSupabaseClient<Database>(event);

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId in route",
    });
  }

  // End the game
  const { data: game, error: gameError } = await client
    .from("bingo_games")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
    })
    .eq("id", gameId)
    .select()
    .single<BingoGame>();

  if (gameError || !game) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to stop game",
    });
  }

  // Get final winner candidates
  const { data: winnerCards, error: winnerError } = await client
    .from("bingo_cards")
    .select("*")
    .eq("game_id", gameId)
    .eq("is_winner_candidate", true);

  if (winnerError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch winner candidates",
    });
  }

  return {
    game,
    winnerCandidates: (winnerCards ?? []) as BingoCard[],
  };
});
