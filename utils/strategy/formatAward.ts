import type { Database } from "~/types/supabase";

type StrategyScoreMetadata =
  Database["public"]["Tables"]["bingo_scores"]["Row"]["metadata"];

const readableOrder = (order?: number | null): string | null => {
  if (!order) return null;
  if (order === 1) return "1st";
  if (order === 2) return "2nd";
  if (order === 3) return "3rd";
  return `${order}th`;
};

const normalizeMetadata = (
  metadata: StrategyScoreMetadata
): Record<string, any> | null =>
  typeof metadata === "object" && metadata ? (metadata as Record<string, any>) : null;

export const formatStrategyAwardLabel = (params: {
  points: number;
  metadata?: StrategyScoreMetadata;
  fallback?: string;
}): string => {
  const meta = normalizeMetadata(params.metadata);
  if (meta?.type === "pattern") {
    return `+${params.points} ${meta.label ?? meta.pattern ?? "Pattern Bonus"}`;
  }
  if (meta?.type === "combo") {
    return `+${params.points} ${meta.label ?? "Combo Bonus"}`;
  }
  if (meta?.type === "placement") {
    const orderLabel = readableOrder(meta.order);
    if (orderLabel) {
      return `+${params.points} pts · ${orderLabel}`;
    }
  }
  if (typeof meta?.notes === "string") {
    return meta.notes;
  }
  return params.fallback ?? `+${params.points} pts`;
};
