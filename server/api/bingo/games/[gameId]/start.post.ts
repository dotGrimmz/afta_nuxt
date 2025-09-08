import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const gameId = event.context.params?.gameId;
  const body = await readBody<{ payout: number }>(event);

  if (!gameId) {
    throw createError({ statusCode: 400, statusMessage: "Missing gameId" });
  }

  // 🔎 Count contestants for this game
  const { count, error: countError } = await client
    .from("bingo_contestants")
    .select("*", { count: "exact", head: true })
    .eq("game_id", gameId);

  if (countError) {
    throw createError({
      statusCode: 500,
      statusMessage: countError.message,
    });
  }

  if (!count || count < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: "At least 2 contestants are required to start the game.",
    });
  }

  console.log("payout:", body.payout);
  // ✅ Safe to start game
  const { data, error } = await client
    .from("bingo_games")
    .update({
      status: "active",
      payout: body.payout,
    })
    .eq("id", gameId)
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { game: data };
});
