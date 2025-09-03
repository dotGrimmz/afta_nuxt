// utils/bingo/generateCard.ts

export type BingoGrid = {
  numbers: number[][]; // 5x5 numbers
  marked: boolean[][]; // same shape, tracks marked cells
};

/**
 * Generate a 5x5 Bingo card grid
 * @param freeSpace - whether the center spot should be auto-marked
 */
export const generateBingoCard = (freeSpace: boolean = false): BingoGrid => {
  // Define column ranges
  const ranges = [
    { min: 1, max: 15 }, // B
    { min: 16, max: 30 }, // I
    { min: 31, max: 45 }, // N
    { min: 46, max: 60 }, // G
    { min: 61, max: 75 }, // O
  ];

  const numbers: number[][] = Array.from({ length: 5 }, () => []);
  const marked: boolean[][] = Array.from({ length: 5 }, () =>
    Array(5).fill(false)
  );

  ranges.forEach((range, col) => {
    // Get 5 random numbers from the column's range
    const pool = Array.from(
      { length: range.max - range.min + 1 },
      (_, i) => i + range.min
    );
    shuffle(pool);
    const selected = pool.slice(0, 5);

    for (let row = 0; row < 5; row++) {
      numbers[row][col] = selected[row];
    }
  });

  // Handle free space (middle cell: row 2, col 2)
  if (freeSpace) {
    numbers[2][2] = 0; // convention: 0 means "FREE"
    marked[2][2] = true;
  }

  return { numbers, marked };
};

/**
 * Fisher-Yates shuffle
 */
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
