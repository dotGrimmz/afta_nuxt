import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const gameId = event.context.params?.gameId;
  const body = await readBody<{ payout: number }>(event);

  if (!gameId) {
    throw createError({ statusCode: 400, statusMessage: "Missing gameId" });
  }

  const { data, error } = await client
    .from("bingo_games")
    .update({
      status: "active",
      payout: body?.payout ?? 0,
    })
    .eq("id", gameId)
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { game: data };
});
