import type { Json } from "~/types/supabase";

export const checkBingo = (card: { grid: Json; draws: number[] }): boolean => {
  const grid = card.grid as {
    numbers: number[][];
    marked: boolean[][]; // already contains free space if the card has one
  };

  if (!grid?.numbers || !grid?.marked) return false;

  const size = 5;

  // Merge DB `marked` + current draws
  const marked: boolean[][] = grid.numbers.map((row, r) =>
    row.map((num, c) => grid.marked[r][c] || card.draws.includes(num))
  );

  const isComplete = (cells: boolean[]): boolean => cells.every((x) => x);

  // Rows
  for (let r = 0; r < size; r++) {
    if (isComplete(marked[r])) return true;
  }

  // Columns
  for (let c = 0; c < size; c++) {
    if (isComplete(marked.map((row) => row[c]))) return true;
  }

  // Diagonal TL → BR
  if (isComplete(marked.map((row, i) => row[i]))) return true;

  // Diagonal TR → BL
  if (isComplete(marked.map((row, i) => row[size - 1 - i]))) return true;

  return false;
};
