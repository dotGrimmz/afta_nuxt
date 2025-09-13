import { serverSupabaseClient } from "#supabase/server";
import { JoinCode } from "~/types/bingo";
import type { Database } from "~/types/supabase";
import { insertBingoCard } from "~/utils/bingo/insertCard";

function generateJoinCode(): JoinCode {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `BINGO-${code}`;
}

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
    username: string;
    numCards: number;
    freeSpace?: boolean;
    autoMark?: boolean;
    contestantId?: string;
  }>(event);

  if (!body?.username || !body?.numCards) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing username or numCards",
    });
  }

  // 1️⃣ Check game status
  const { data: game, error: gameError } = await client
    .from("bingo_games")
    .select("status")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    throw createError({
      statusCode: 404,
      statusMessage: "Game not found",
    });
  }

  if (game.status !== "lobby") {
    throw createError({
      statusCode: 400,
      statusMessage: "Cannot join — game already started",
    });
  }

  // 2️⃣ Generate join code
  const joinCode = generateJoinCode();

  // 3️⃣ Insert contestant
  const { data: contestant, error: contestantError } = await client
    .from("bingo_contestants")
    .insert({
      game_id: gameId,
      username: body.username,
      code: joinCode,
      num_cards: body.numCards,
    })
    .select("*")
    .single();

  if (contestantError || !contestant) {
    throw createError({
      statusCode: 500,
      statusMessage: contestantError?.message || "Failed to add contestant",
    });
  }

  // 4️⃣ Generate cards
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
    code: joinCode, // 👈 return it so client sees join code
    cards,
  };
});
