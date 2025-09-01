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

  // get username from profiles
  const { data: profile } = await client
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const displayName = profile?.username ?? "Anonymous";

  // upsert into game_players
  const { data, error } = await client
    .from("game_players")
    .upsert(
      {
        game_id: gameId,
        user_id: user.id,
        role: "contestant",
        display_name: displayName,
        score: 0,
      },
      { onConflict: "game_id,user_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to join game:", error.message);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to join game",
    });
  }

  return { joined: true, player: data };
});
