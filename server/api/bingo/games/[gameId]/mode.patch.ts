import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import type { GameMode } from "~/types/bingo";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const gameId = event.context.params?.gameId;
  const body = await readBody<{ mode: GameMode }>(event);

  if (!gameId) {
    throw createError({ statusCode: 400, statusMessage: "Missing gameId" });
  }

  const nextMode = (body.mode ?? "classic").toLowerCase() as GameMode;
  if (!["classic", "strategy"].includes(nextMode)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid mode. Use 'classic' or 'strategy'.",
    });
  }

  const { data: game, error: gameError } = await client
    .from("bingo_games")
    .select("status, mode")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    throw createError({
      statusCode: 404,
      statusMessage: "Game not found",
    });
  }

  if (game.status !== "lobby") {
    throw createError({
      statusCode: 400,
      statusMessage: "Only lobby games can change modes",
    });
  }

  if (game.mode === nextMode) {
    return { mode: game.mode };
  }

  const { data, error } = await client
    .from("bingo_games")
    .update({ mode: nextMode })
    .eq("id", gameId)
    .select()
    .single();

  if (error || !data) {
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? "Failed to update mode",
    });
  }

  return { game: data };
});
