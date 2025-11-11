import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

const MAX_STRATEGY_DRAWS = 75;

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const body = await readBody<{ payout?: number; mode?: string }>(event);

  const mode = (body.mode ?? "classic").toLowerCase();
  const normalizedMode = ["classic", "strategy"].includes(mode)
    ? mode
    : "classic";

  const { data, error } = await client
    .from("bingo_games")
    .insert({
      status: "lobby",
      payout: body.payout ?? 0,
      mode: normalizedMode,
      strategy_draw_limit_enabled: false,
      strategy_draw_limit: null,
      strategy_draws_per_round: MAX_STRATEGY_DRAWS,
    })
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { game: data };
});
