import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

type BingoGame = Database["public"]["Tables"]["bingo_games"]["Row"];
type BingoContestant = Database["public"]["Tables"]["bingo_contestants"]["Row"];
type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];
type BingoDraw = Database["public"]["Tables"]["bingo_draws"]["Row"];

export default defineEventHandler(async (event) => {
  const gameId = event.context.params?.gameId;
  const client = await serverSupabaseClient<Database>(event);

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId in route",
    });
  }

  // Fetch game info
  const { data: game, error: gameError } = await client
    .from("bingo_games")
    .select("*")
    .eq("id", gameId)
    .single<BingoGame>();

  if (gameError || !game) {
    throw createError({
      statusCode: 404,
      statusMessage: "Game not found",
    });
  }

  // Fetch draws
  const { data: draws, error: drawsError } = await client
    .from("bingo_draws")
    .select("*")
    .eq("game_id", gameId)
    .order("draw_order", { ascending: true });

  if (drawsError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch draws",
    });
  }

  // Fetch contestants
  const { data: contestants, error: contestantsError } = await client
    .from("bingo_contestants")
    .select("*")
    .eq("game_id", gameId);

  if (contestantsError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch contestants",
    });
  }

  // Fetch winner candidates
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
    draws: (draws ?? []) as BingoDraw[],
    contestants: (contestants ?? []) as BingoContestant[],
    winnerCandidates: (winnerCards ?? []) as BingoCard[],
  };
});
