import type { Json } from "~/types/supabase";

export const checkBingo = (card: { grid: Json; draws: number[] }): boolean => {
  const grid = card.grid as {
    numbers: number[][];
    marked: boolean[][];
  };

  if (!grid?.numbers || !grid?.marked) {
    return false;
  }

  const size = 5;

  // Helper: check full row or column
  const isComplete = (cells: boolean[]): boolean => {
    return cells.every((marked) => marked === true);
  };

  // Rows
  for (let row = 0; row < size; row++) {
    if (isComplete(grid.marked[row])) {
      return true;
    }
  }

  // Columns
  for (let col = 0; col < size; col++) {
    const column = [];
    for (let row = 0; row < size; row++) {
      column.push(grid.marked[row][col]);
    }
    if (isComplete(column)) {
      return true;
    }
  }

  // Diagonal (top-left to bottom-right)
  const diag1 = [];
  for (let i = 0; i < size; i++) {
    diag1.push(grid.marked[i][i]);
  }
  if (isComplete(diag1)) {
    return true;
  }

  // Diagonal (top-right to bottom-left)
  const diag2 = [];
  for (let i = 0; i < size; i++) {
    diag2.push(grid.marked[i][size - 1 - i]);
  }
  if (isComplete(diag2)) {
    return true;
  }

  return false;
};
