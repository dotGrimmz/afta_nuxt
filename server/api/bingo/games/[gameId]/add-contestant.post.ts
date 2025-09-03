import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import { insertBingoCard } from "~/utils/bingo/insertCard";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const gameId = event.context.params?.gameId;

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId in route params",
    });
  }

  // Body: username, numCards, freeSpace flag, autoMark flag
  const body = await readBody<{
    username: string;
    numCards: number;
    freeSpace?: boolean;
    autoMark?: boolean;
  }>(event);

  if (!body?.username || !body?.numCards) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing username or numCards in request body",
    });
  }

  // Generate unique join code
  const joinCode = `BINGO-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

  // Create contestant
  const { data: contestant, error: contestantError } = await client
    .from("bingo_contestants")
    .insert({
      game_id: gameId,
      username: body.username,
      code: joinCode,
      num_cards: body.numCards,
    })
    .select()
    .single();

  if (contestantError) {
    throw createError({
      statusCode: 500,
      statusMessage: contestantError.message,
    });
  }

  // Generate cards for this contestant
  const cards = [];
  for (let i = 0; i < body.numCards; i++) {
    const card = await insertBingoCard(
      event,
      gameId,
      contestant.id,
      body.freeSpace ?? false,
      body.autoMark ?? false
    );
    cards.push(card);
  }

  return {
    contestant,
    code: joinCode,
    cards,
  };
});
