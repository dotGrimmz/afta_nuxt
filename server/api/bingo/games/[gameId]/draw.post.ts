import { drawNumber } from "~/utils/bingo/drawNumber";
import type { Database } from "~/types/supabase";

type BingoDraw = Database["public"]["Tables"]["bingo_draws"]["Row"];
type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];

export default defineEventHandler(async (event) => {
  const gameId = event.context.params?.gameId;

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId in route",
    });
  }

  try {
    const { draw, winners } = await drawNumber(event, gameId);

    return {
      draw: draw as BingoDraw,
      winners: winners as BingoCard[],
    };
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message ?? "Failed to draw number",
    });
  }
});
