import { serverSupabaseClient } from "#supabase/server";
import { insertBingoCard } from "./insertCard";

function generateContestantCode(): string {
  // Example: BINGO-AB12
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BINGO-${code}`;
}

/**
 * Create a contestant and their cards
 * @param event - Nitro event
 * @param gameId - UUID of the bingo game
 * @param username - Display name of the contestant
 * @param numCards - Number of cards to assign
 * @param freeSpace - Whether cards should include free space
 * @param autoMark - Whether cards should auto-mark numbers
 */
export const createContestant = async (
  event: any,
  gameId: string,
  username: string,
  numCards: number = 1,
  freeSpace: boolean = false,
  autoMark: boolean = false
) => {
  const client = await serverSupabaseClient(event);

  // Generate unique join code
  const code = generateContestantCode();

  // Insert contestant
  const { data: contestant, error: contestantError } = await client
    .from("bingo_contestants")
    .insert({
      game_id: gameId,
      username,
      code,
      num_cards: numCards,
    })
    .select()
    .single();

  if (contestantError) {
    throw new Error(`Failed to create contestant: ${contestantError.message}`);
  }

  // Generate their cards
  const cards = [];
  for (let i = 0; i < numCards; i++) {
    const card = await insertBingoCard(
      event,
      gameId,
      contestant.id,
      freeSpace,
      autoMark
    );
    cards.push(card);
  }

  return {
    contestant,
    code,
    cards,
  };
};
