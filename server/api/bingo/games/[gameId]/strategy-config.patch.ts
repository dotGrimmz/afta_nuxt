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

  const body = await readBody<{
    firstPlacePoints?: number;
    secondPlacePoints?: number;
    thirdPlacePoints?: number;
    requiredWinners?: number;
  }>(event);

  const { data: game, error } = await client
    .from("bingo_games")
    .select("status, mode")
    .eq("id", gameId)
    .single();

  if (error || !game) {
    throw createError({
      statusCode: 404,
      statusMessage: error?.message ?? "Game not found",
    });
  }

  if (game.status !== "lobby") {
    throw createError({
      statusCode: 400,
      statusMessage: "Strategy settings can only be changed in the lobby.",
    });
  }

  if (game.mode !== "strategy") {
    throw createError({
      statusCode: 400,
      statusMessage: "Game must be in strategy mode to update strategy settings.",
    });
  }

  const updates: Database["public"]["Tables"]["bingo_games"]["Update"] = {};
  if (typeof body.firstPlacePoints === "number") {
    updates.strategy_first_place_points = body.firstPlacePoints;
  }
  if (typeof body.secondPlacePoints === "number") {
    updates.strategy_second_place_points = body.secondPlacePoints;
  }
  if (typeof body.thirdPlacePoints === "number") {
    updates.strategy_third_place_points = body.thirdPlacePoints;
  }
  if (typeof body.requiredWinners === "number") {
    updates.strategy_required_winners = body.requiredWinners;
  }

  const { data: updatedGame, error: updateError } = await client
    .from("bingo_games")
    .update(updates)
    .eq("id", gameId)
    .select("*")
    .single();

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: updateError.message,
    });
  }

  return { game: updatedGame };
});
