import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

type BingoContestant = Database["public"]["Tables"]["bingo_contestants"]["Row"];
type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];

export default defineEventHandler(async (event) => {
  const code = event.context.params?.code;
  const client = await serverSupabaseClient<Database>(event);

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing contestant code",
    });
  }

  const { data: contestant, error: contestantError } = await client
    .from("bingo_contestants")
    .select("*")
    .eq("code", code)
    .single<BingoContestant>();

  if (contestantError || !contestant) {
    throw createError({
      statusCode: 404,
      statusMessage: "Contestant not found",
    });
  }

  const { data: cards, error: cardsError } = await client
    .from("bingo_cards")
    .select("*")
    .eq("contestant_id", contestant.id);

  if (cardsError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch cards",
    });
  }

  return {
    contestant,
    cards: (cards ?? []) as BingoCard[],
  };
});
