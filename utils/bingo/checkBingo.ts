import type { Json } from "~/types/supabase";
import { buildMarkedGrid, hasLineBingo } from "./patterns";

export const checkBingo = (card: { grid: Json; draws: number[] }): boolean => {
  const merged = buildMarkedGrid({
    grid: card.grid,
    draws: card.draws ?? [],
  });
  if (!merged) return false;
  return hasLineBingo(merged.marked);
};
