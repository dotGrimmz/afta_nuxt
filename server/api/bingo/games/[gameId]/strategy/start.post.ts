import { serverSupabaseClient } from "#supabase/server";
import { startStrategyAutomation } from "~/server/services/strategyController";
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

  const { data: game, error } = await client
    .from("bingo_games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (error || !game) {
    throw createError({
      statusCode: 404,
      statusMessage: error?.message ?? "Game not found",
    });
  }

  if (game.mode !== "strategy") {
    throw createError({
      statusCode: 400,
      statusMessage: "Game must be in strategy mode to start automation.",
    });
  }

  if (game.status === "ended") {
    throw createError({
      statusCode: 400,
      statusMessage: "Cannot start automation on an ended game.",
    });
  }

  await startStrategyAutomation(gameId);

  return {
    gameId,
    message: "Strategy automation started (scaffolding).",
  };
});
