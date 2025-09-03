import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const gameId = event.context.params?.gameId;

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId",
    });
  }

  const body = await readBody<{
    cardId: string;
    contestantId: string;
  }>(event);

  if (!body?.cardId || !body?.contestantId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing cardId or contestantId",
    });
  }

  // Verify that the card belongs to this game + contestant
  const { data: card, error: cardError } = await client
    .from("bingo_cards")
    .select("id, game_id, contestant_id")
    .eq("id", body.cardId)
    .eq("game_id", gameId)
    .eq("contestant_id", body.contestantId)
    .single();

  if (cardError || !card) {
    throw createError({
      statusCode: 404,
      statusMessage: "Card not found for this game/contestant",
    });
  }

  // Mark card as winner candidate
  const { data, error } = await client
    .from("bingo_cards")
    .update({ is_winner_candidate: true })
    .eq("id", body.cardId)
    .eq("contestant_id", body.contestantId)
    .eq("game_id", gameId)
    .select()
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return {
    message: "Bingo called successfully",
    card: data,
  };
});
