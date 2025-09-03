import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

type BingoResult = Database["public"]["Tables"]["bingo_results"]["Row"];
type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];

export default defineEventHandler(async (event) => {
  const gameId = event.context.params?.gameId;
  const body = await readBody(event);
  const client = await serverSupabaseClient<Database>(event);

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId in route",
    });
  }

  if (!body?.cardId || !body?.contestantId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing cardId or contestantId in request body",
    });
  }

  // Double-check that the card belongs to the game + contestant
  const { data: card, error: cardError } = await client
    .from("bingo_cards")
    .select("*")
    .eq("id", body.cardId)
    .eq("contestant_id", body.contestantId)
    .eq("game_id", gameId)
    .single<BingoCard>();

  if (cardError || !card) {
    throw createError({
      statusCode: 404,
      statusMessage: "Card not found for this game/contestant",
    });
  }

  // Insert into results
  const { data: result, error: resultError } = await client
    .from("bingo_results")
    .insert({
      game_id: gameId,
      contestant_id: body.contestantId,
      card_id: body.cardId,
      payout: body.payout ?? 0, // allow admin to specify payout
    })
    .select()
    .single<BingoResult>();

  if (resultError || !result) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to record winner",
    });
  }

  return {
    message: "Winner confirmed",
    result,
  };
});
