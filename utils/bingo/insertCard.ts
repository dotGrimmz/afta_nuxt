import { serverSupabaseClient } from "#supabase/server";
import { generateBingoCard } from "~/utils/bingo/generateCard";
import type { Database } from "~/types/supabase";

type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];

/**
 * Insert a generated bingo card for a contestant into the database
 */
export const insertBingoCard = async (
  event: any,
  gameId: string,
  contestantId: string,
  freeSpace: boolean = false,
  autoMark: boolean = false
): Promise<BingoCard> => {
  const client = await serverSupabaseClient<Database>(event);

  // Generate the 5x5 board
  const grid = generateBingoCard(freeSpace);

  // Insert into bingo_cards
  const { data, error } = await client
    .from("bingo_cards")
    .insert({
      game_id: gameId,
      contestant_id: contestantId,
      grid,
      free_space: freeSpace,
      auto_mark_enabled: autoMark,
    })
    .select()
    .single<BingoCard>();

  if (error || !data) {
    throw new Error(`Failed to insert bingo card: ${error?.message}`);
  }

  return data;
};
