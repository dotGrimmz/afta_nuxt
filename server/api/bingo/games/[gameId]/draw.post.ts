import { drawNumber } from "~/utils/bingo/drawNumber";
import type { Database } from "~/types/supabase";

type BingoDraw = Database["public"]["Tables"]["bingo_draws"]["Row"];

export default defineEventHandler(async (event) => {
  const gameId = event.context.params?.gameId;

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId in route",
    });
  }

  try {
    const { draw } = await drawNumber(event, gameId);

    return {
      draw: draw as BingoDraw,
    };
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message ?? "Failed to draw number",
    });
  }
});
