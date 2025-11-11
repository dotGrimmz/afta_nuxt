import type { StrategyBonusRules, StrategyPatternMatch } from "~/types/bingo";
import type { Json } from "~/types/supabase";

type BingoGrid = {
  numbers: number[][];
  marked: boolean[][];
};

type PatternCardInput = {
  grid: Json | BingoGrid;
  draws: number[];
};

const normalizeGrid = (grid: Json | BingoGrid): BingoGrid | null => {
  const parsed = grid as BingoGrid;
  if (
    !parsed ||
    !Array.isArray(parsed.numbers) ||
    !Array.isArray(parsed.marked)
  ) {
    return null;
  }
  return parsed;
};

const toTitle = (id: string): string =>
  id
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

export const buildMarkedGrid = (
  card: PatternCardInput
): { numbers: number[][]; marked: boolean[][] } | null => {
  const grid = normalizeGrid(card.grid);
  if (!grid?.numbers || !grid.marked) {
    return null;
  }

  const drawsSet = new Set(card.draws ?? []);

  const merged = grid.numbers.map((row, r) =>
    row.map((num, c) => {
      const preset = grid.marked?.[r]?.[c] ?? false;
      return preset || drawsSet.has(num);
    })
  );

  return { numbers: grid.numbers, marked: merged };
};

const isComplete = (cells: boolean[]): boolean => cells.every(Boolean);

export const hasLineBingo = (marked: boolean[][]): boolean => {
  if (!marked.length) return false;
  const size = marked.length;

  // Rows
  for (let r = 0; r < size; r++) {
    if (isComplete(marked[r])) return true;
  }

  // Columns
  for (let c = 0; c < size; c++) {
    if (isComplete(marked.map((row) => row[c]))) return true;
  }

  // Diagonals
  if (isComplete(marked.map((row, i) => row[i]))) return true;
  if (isComplete(marked.map((row, i) => row[size - 1 - i]))) return true;

  return false;
};

export const checkFourCorners = (marked: boolean[][]): boolean => {
  if (marked.length < 2 || marked[0]?.length < 2) return false;
  const lastRow = marked.length - 1;
  const lastCol = marked[0].length - 1;
  return (
    marked[0][0] &&
    marked[0][lastCol] &&
    marked[lastRow][0] &&
    marked[lastRow][lastCol]
  );
};

export const checkXPattern = (marked: boolean[][]): boolean => {
  if (!marked.length) return false;
  const size = marked.length;
  return (
    isComplete(marked.map((row, i) => row[i])) &&
    isComplete(marked.map((row, i) => row[size - 1 - i]))
  );
};

const strategyPatternCheckers: Record<
  string,
  (marked: boolean[][]) => boolean
> = {
  fourCorners: checkFourCorners,
  x: checkXPattern,
};

export const detectStrategyPatternBonuses = (
  card: PatternCardInput,
  rules?: StrategyBonusRules | null
): StrategyPatternMatch[] => {
  if (!rules?.patterns) return [];
  const merged = buildMarkedGrid(card);
  if (!merged) return [];

  const matches: StrategyPatternMatch[] = [];
  for (const [patternId, config] of Object.entries(rules.patterns)) {
    if (!config || config.points <= 0) continue;
    const checker = strategyPatternCheckers[patternId];
    if (!checker) continue;
    if (checker(merged.marked)) {
      matches.push({
        id: patternId,
        label: config.label ?? toTitle(patternId),
        points: config.points,
      });
    }
  }

  return matches;
};
