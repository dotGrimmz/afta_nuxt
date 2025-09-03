import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const gameId = event.context.params?.gameId;

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId in route",
    });
  }

  const body = await readBody<{
    cardId: string;
    contestantId: string;
    payout: number;
  }>(event);

  if (!body?.cardId || !body?.contestantId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing cardId or contestantId",
    });
  }

  // 1️⃣ Insert result
  const { data: result, error: resultError } = await client
    .from("bingo_results")
    .insert({
      game_id: gameId,
      card_id: body.cardId,
      contestant_id: body.contestantId,
      payout: body.payout,
    })
    .select("*")
    .single();

  if (resultError || !result) {
    throw createError({
      statusCode: 500,
      statusMessage: resultError?.message || "Failed to insert bingo result",
    });
  }

  // 2️⃣ End the game
  const { data: updatedGame, error: updateError } = await client
    .from("bingo_games")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", gameId)
    .select("*")
    .single();

  if (updateError || !updatedGame) {
    throw createError({
      statusCode: 500,
      statusMessage: updateError?.message || "Failed to end game",
    });
  }

  // 3️⃣ Return both
  return {
    result,
    game: updatedGame,
  };
});
