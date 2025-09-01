import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { H3Event } from "h3";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event: H3Event) => {
  const client = await serverSupabaseClient<Database>(event);
  const user = await serverSupabaseUser(event);
  const gameId = getRouterParam(event, "id");

  if (!user || !gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing game ID or user not authenticated",
    });
  }

  // ensure only host can start game
  const { data: game, error: fetchError } = await client
    .from("games")
    .select("host_user_id")
    .eq("id", gameId)
    .single();

  if (fetchError || !game) {
    throw createError({ statusCode: 404, statusMessage: "Game not found" });
  }

  if (game.host_user_id !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: "Only the host can start the game",
    });
  }

  const { error } = await client
    .from("games")
    .update({ status: "live" as Database["public"]["Enums"]["game_status"] })
    .eq("id", gameId);

  if (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to start game",
    });
  }

  return { success: true };
});
