import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

type BingoGame = Database["public"]["Tables"]["bingo_games"]["Row"];
type BingoDraw = Database["public"]["Tables"]["bingo_draws"]["Row"];
type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];

/**
 * Draws the next number for a game.
 * Inserts into bingo_draws, updates auto-marked cards,
 * and flags winner candidates.
 */
export const drawNumber = async (
  event: any,
  gameId: string
): Promise<{ draw: BingoDraw; winners: BingoCard[] }> => {
  const client = await serverSupabaseClient<Database>(event);

  // Fetch all previously drawn numbers
  const { data: draws, error: drawsError } = await client
    .from("bingo_draws")
    .select("number")
    .eq("game_id", gameId);

  if (drawsError) {
    throw new Error(`Failed to fetch draws: ${drawsError.message}`);
  }

  const drawnNumbers: number[] = (draws ?? []).map((d) => d.number);

  // Get remaining pool
  const pool: number[] = Array.from({ length: 75 }, (_, i) => i + 1).filter(
    (n) => {
      return !drawnNumbers.includes(n);
    }
  );

  if (pool.length === 0) {
    throw new Error("No numbers left to draw");
  }

  // Pick a random number from remaining pool
  const number: number = pool[Math.floor(Math.random() * pool.length)];

  // Insert into bingo_draws
  const { data: draw, error: insertError } = await client
    .from("bingo_draws")
    .insert({
      game_id: gameId,
      number,
      draw_order: drawnNumbers.length + 1,
    })
    .select()
    .single<BingoDraw>();

  if (insertError || !draw) {
    throw new Error(`Failed to insert draw: ${insertError?.message}`);
  }

  // Fetch all auto-marked cards
  const { data: cards } = await client
    .from("bingo_cards")
    .select("*")
    .eq("game_id", gameId)
    .eq("auto_mark_enabled", true);

  const updatedWinners: BingoCard[] = [];

  if (cards) {
    for (const card of cards) {
      const grid = card.grid as { numbers: number[][]; marked: boolean[][] };
      let updated = false;

      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (grid.numbers[r][c] === number) {
            grid.marked[r][c] = true;
            updated = true;
          }
        }
      }

      if (updated) {
        const isWinner: boolean = checkBingo(grid.marked);

        const { data: updatedCard } = await client
          .from("bingo_cards")
          .update({
            grid,
            is_winner_candidate: isWinner,
          })
          .eq("id", card.id)
          .select()
          .single<BingoCard>();

        if (isWinner && updatedCard) {
          updatedWinners.push(updatedCard);
        }
      }
    }
  }

  return {
    draw,
    winners: updatedWinners,
  };
};

/**
 * Check if marked grid has any complete row, col, or diagonal
 */
function checkBingo(marked: boolean[][]): boolean {
  // Rows
  for (let r = 0; r < 5; r++) {
    if (marked[r].every((v) => v)) {
      return true;
    }
  }

  // Cols
  for (let c = 0; c < 5; c++) {
    if (marked.every((row) => row[c])) {
      return true;
    }
  }

  // Diagonals
  if ([0, 1, 2, 3, 4].every((i) => marked[i][i])) {
    return true;
  }

  if ([0, 1, 2, 3, 4].every((i) => marked[i][4 - i])) {
    return true;
  }

  return false;
}
