import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

type BingoGame = Database["public"]["Tables"]["bingo_games"]["Row"];
type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];
type BingoResult = Database["public"]["Tables"]["bingo_results"]["Row"];

export default defineEventHandler(async (event) => {
  const gameId = event.context.params?.gameId;
  const client = await serverSupabaseClient<Database>(event);

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId in route",
    });
  }

  // 1️⃣ End the game
  const { data: game, error: gameError } = await client
    .from("bingo_games")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
    })
    .eq("id", gameId)
    .select()
    .single<BingoGame>();

  if (gameError || !game) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to stop game",
    });
  }

  // 2️⃣ Get final winner candidates (normal flow)
  const { data: winnerCards, error: winnerError } = await client
    .from("bingo_cards")
    .select("*")
    .eq("game_id", gameId)
    .eq("is_winner_candidate", true);

  if (winnerError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch winner candidates",
    });
  }

  // 3️⃣ If no winners → insert "admin stop" record into results
  if (!winnerCards || winnerCards.length === 0) {
    const { error: insertError } = await client.from("bingo_results").insert({
      game_id: gameId,
      contestant_id: null, // 👈 sentinel value
      card_id: null, // no card tied
      payout: 0,
      username: "Admin Stop", // 👈 requires you added username column
    } as any);

    if (insertError) {
      console.log(insertError);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to log admin stop in results",
      });
    }
  }

  return {
    game,
    winnerCandidates: (winnerCards ?? []) as BingoCard[],
  };
});
