// import type { Database } from "~/types/supabase"; // generated file
import { serverSupabaseClient } from "#supabase/server";
import type { H3Event } from "h3";
import { Database } from "~/types/supabase";

type GameRow = Database["public"]["Tables"]["games"]["Row"];
type GamePlayerRow = Database["public"]["Tables"]["game_players"]["Row"];

export default defineEventHandler(async (event: H3Event) => {
  const client = await serverSupabaseClient<Database>(event);

  const gameId = getRouterParam(event, "id");
  if (!gameId) {
    throw createError({ statusCode: 400, statusMessage: "Missing game ID" });
  }

  const { data, error } = await client
    .from("games")
    .select(
      `
      id,
      title,
      status,
      created_at,
      game_players (
        user_id,
        display_name,
        avatar_url,
        role,
        score
      )
    `
    )
    .eq("id", gameId)
    .single<GameRow & { game_players: GamePlayerRow[] }>();

  if (error || !data) {
    console.error("Failed to load game:", error?.message);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to load game",
    });
  }

  const host = data.game_players.find((p) => p.role === "host") ?? null;
  const contestants = data.game_players.filter((p) => p.role === "contestant");

  return {
    ...data,
    host,
    contestants,
  };
});
