import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const gameId = event.context.params?.gameId;
  const body = await readBody<{
    cardId: string;
    contestantId: string;
    payout?: number;
  }>(event);

  if (!gameId || !body?.cardId || !body?.contestantId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId, cardId, or contestantId",
    });
  }

  const { data, error } = await client
    .from("bingo_results")
    .insert({
      game_id: gameId,
      card_id: body.cardId,
      contestant_id: body.contestantId,
      payout: body.payout ?? 0, // ✅ store payout
    })
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { result: data };
});
