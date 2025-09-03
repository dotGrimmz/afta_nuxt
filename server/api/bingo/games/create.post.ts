import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const body = await readBody<{ payout: number }>(event);

  const { data, error } = await client
    .from("bingo_games")
    .insert({
      status: "lobby",
      payout: body.payout ?? 0,
    })
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { game: data };
});
