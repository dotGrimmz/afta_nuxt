import type { Database } from "#build/types/supabase-database";
import { serverSupabaseClient } from "#supabase/server";
import type {
  BingoGameRow,
  ContestantType,
  BingoCard,
  BingoDrawRow,
  BingoCardRow,
  BingoCardGrid,
  GameStateResponse,
} from "~/types/bingo";

export default defineEventHandler(async (event) => {
  const gameId = event.context.params?.gameId;
  const client = await serverSupabaseClient<Database>(event);

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId in route",
    });
  }

  // Game info
  const { data: game, error: gameError } = await client
    .from("bingo_games")
    .select("*")
    .eq("id", gameId)
    .single<BingoGameRow>();

  if (gameError || !game) {
    throw createError({ statusCode: 404, statusMessage: "Game not found" });
  }

  // Draws
  const { data: draws, error: drawsError } = await client
    .from("bingo_draws")
    .select("*")
    .eq("game_id", gameId)
    .order("draw_order", { ascending: true });

  if (drawsError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch draws",
    });
  }

  // Contestants
  const { data: contestants, error: contestantsError } = await client
    .from("bingo_contestants")
    .select("*")
    .eq("game_id", gameId);

  if (contestantsError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch contestants",
    });
  }

  // All cards
  const { data: allCards, error: cardsError } = await client
    .from("bingo_cards")
    .select("*")
    .eq("game_id", gameId);

  if (cardsError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch cards",
    });
  }

  // Filter winner candidates
  const toCard = (c: BingoCardRow): BingoCard => ({
    ...c,
    grid: c.grid as unknown as BingoCardGrid,
  });

  const allCardsTyped: BingoCard[] = (allCards ?? []).map(toCard);
  const winnerCards: BingoCard[] = allCardsTyped.filter(
    (c) => c.is_winner_candidate === true
  );

  const payload: GameStateResponse = {
    game,
    draws: draws ?? [],
    contestants: contestants ?? [],
    winnerCandidates: winnerCards,
    candidates: allCardsTyped,
    winners: [],
  };

  return payload;
});
