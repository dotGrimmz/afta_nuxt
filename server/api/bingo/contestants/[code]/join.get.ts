import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const code = event.context.params?.code;

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing join code",
    });
  }

  // Look up contestant by code
  const { data: contestant, error: contestantError } = await client
    .from("bingo_contestants")
    .select("*")
    .eq("code", code)
    .single();

  if (contestantError || !contestant) {
    throw createError({
      statusCode: 404,
      statusMessage: "Invalid or expired join code",
    });
  }

  // Fetch this contestant's cards
  const { data: cards, error: cardsError } = await client
    .from("bingo_cards")
    .select("*")
    .eq("contestant_id", contestant.id);

  if (cardsError) {
    throw createError({
      statusCode: 500,
      statusMessage: cardsError.message,
    });
  }

  return {
    contestant,
    cards: cards ?? [],
  };
});
