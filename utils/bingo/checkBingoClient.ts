// utils/bingo/checkBingoClient.ts
export type BingoGrid = { numbers: unknown[][]; marked: boolean[][] };

/**
 * Client-side bingo check:
 * A cell counts iff (marked && drawn) OR it's FREE (default 0).
 * Works for 5x5; also handles NxN gracefully for rows/cols/diagonals.
 */
export const checkBingoClient = (
  grid: BingoGrid,
  draws: Array<number | string>,
  freeValue: number = 0
): boolean => {
  const toNum = (v: unknown): number =>
    typeof v === "number" ? v : Number.parseInt(String(v), 10);

  const drawsSet = new Set(draws.map(toNum));
  const nums = grid.numbers.map((row) => row.map(toNum));
  const marked = grid.marked;

  const rows = nums.length;
  const cols = rows ? nums[0].length : 0;
  if (!rows || !cols) return false;

  const counts = (r: number, c: number): boolean => {
    const n = nums[r][c];
    if (n === freeValue) return true; // FREE space
    return marked[r][c] === true && drawsSet.has(n); // pressed AND drawn
  };

  // rows
  for (let r = 0; r < rows; r++) {
    let ok = true;
    for (let c = 0; c < cols; c++) {
      if (!counts(r, c)) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }

  // cols
  for (let c = 0; c < cols; c++) {
    let ok = true;
    for (let r = 0; r < rows; r++) {
      if (!counts(r, c)) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }

  // diagonals (square-ish boards)
  const n = Math.min(rows, cols);
  let d1 = true,
    d2 = true;
  for (let i = 0; i < n; i++) {
    if (!counts(i, i)) d1 = false;
    if (!counts(i, cols - 1 - i)) d2 = false;
  }
  return d1 || d2;
};
