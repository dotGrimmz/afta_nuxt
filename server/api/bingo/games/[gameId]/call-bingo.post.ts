import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const gameId = event.context.params?.gameId;

  console.log({ gameId });
  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId",
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

  // 1️⃣ Verify the card belongs to this game + contestant
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

  // 2️⃣ Fetch contestant to get username
  const { data: contestant, error: contestantError } = await client
    .from("bingo_contestants")
    .select("username")
    .eq("id", body.contestantId)
    .single();

  console.log("contestant", contestant);
  if (contestantError || !contestant) {
    throw createError({
      statusCode: 404,
      statusMessage: "Contestant not found",
    });
  }

  console.log("storing payout in results", body.payout);
  // 3️⃣ Insert into bingo_results (with username)
  const { data: result, error: resultError } = await client
    .from("bingo_results")
    .insert({
      game_id: gameId,
      card_id: body.cardId,
      contestant_id: body.contestantId,
      payout: body.payout,
      username: contestant.username, // 👈 required now
    })
    .select("*")
    .single();
  console.log("result", result);

  if (resultError || !result) {
    throw createError({
      statusCode: 500,
      statusMessage: resultError?.message || "Failed to insert bingo result",
    });
  }

  console.log(" body?", body);
  // 4️⃣ End the game immediately
  const { data: updatedGame, error: updateError } = await client
    .from("bingo_games")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
      winner_id: body.contestantId,
      winner_username: contestant.username,
      payout: body.payout,
    })
    .eq("id", gameId)
    .select("*")
    .single();

  if (updateError || !updatedGame) {
    throw createError({
      statusCode: 500,
      statusMessage: updateError?.message || "Failed to end game",
    });
  }

  return {
    message: "Bingo confirmed and game ended",
    result,
    game: updatedGame,
  };
});
