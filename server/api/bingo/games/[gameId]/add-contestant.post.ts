import { createContestant } from "~/utils/bingo/createContestant";
import type { Database } from "~/types/supabase";

type BingoContestant = Database["public"]["Tables"]["bingo_contestants"]["Row"];
type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];

export default defineEventHandler(async (event) => {
  const gameId = event.context.params?.gameId;
  const body = await readBody(event);

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId in route",
    });
  }

  if (!body?.username) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing username in request body",
    });
  }

  const result = await createContestant(
    event,
    gameId,
    body.username as string,
    body.numCards ?? 1,
    body.freeSpace ?? false,
    body.autoMark ?? false
  );

  return {
    contestant: result.contestant as BingoContestant,
    code: result.code,
    cards: result.cards as BingoCard[],
  };
});
