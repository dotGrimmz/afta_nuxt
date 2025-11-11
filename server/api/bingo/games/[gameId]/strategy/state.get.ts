import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const gameId = event.context.params?.gameId;

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId in route",
    });
  }

  const { data: game, error: gameError } = await client
    .from("bingo_games")
    .select("id, mode, status")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    throw createError({
      statusCode: 404,
      statusMessage: "Game not found",
    });
  }

  const { data: rounds, error: roundsError } = await client
    .from("bingo_rounds")
    .select("*")
    .eq("game_id", gameId)
    .order("round_number", { ascending: true });

  if (roundsError) {
    throw createError({
      statusCode: 500,
      statusMessage: roundsError.message,
    });
  }

  const activeRound = (rounds ?? []).find(
    (round) => round.status === "active"
  );
  const nextRound = (rounds ?? []).find(
    (round) => round.status === "pending"
  );

  return {
    game,
    rounds: rounds ?? [],
    activeRound,
    nextRound,
    automationRunning: Boolean(activeRound),
  };
});
