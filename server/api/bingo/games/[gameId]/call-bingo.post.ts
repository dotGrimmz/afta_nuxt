import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const gameId = event.context.params?.gameId;
  const body = await readBody<{ contestantId: string }>(event);

  if (!gameId || !body?.contestantId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId or contestantId",
    });
  }

  // Mark contestant’s cards as candidate
  const { error } = await client
    .from("bingo_cards")
    .update({ is_winner_candidate: true })
    .eq("game_id", gameId)
    .eq("contestant_id", body.contestantId);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return { success: true };
});
