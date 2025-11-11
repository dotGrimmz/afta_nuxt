import { serverSupabase } from "../utils/supabase";
import type { StrategyPatternMatch } from "~/types/bingo";
import type { Database } from "~/types/supabase";

export type StrategyBonusDescriptor =
  | {
      type: "pattern";
      id: string;
      label: string;
      points: number;
    }
  | {
      type: "combo";
      id: string;
      label: string;
      points: number;
    };

type AwardStrategyPointsInput = {
  gameId: string;
  eventId: string | null;
  roundId: string | null;
  contestantId: string;
  basePoints: number;
  placementOrder: number;
  source?: "auto" | "manual";
  patternMatches?: StrategyPatternMatch[];
  bonusDescriptors?: StrategyBonusDescriptor[];
};

const getLatestTotal = async (
  gameId: string,
  contestantId: string
): Promise<number> => {
  const { data } = await serverSupabase
    .from("bingo_scores")
    .select("total_after_round")
    .eq("game_id", gameId)
    .eq("contestant_id", contestantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.total_after_round ?? 0;
};

export const awardStrategyPoints = async (
  payload: AwardStrategyPointsInput
): Promise<Database["public"]["Tables"]["bingo_scores"]["Row"][]> => {
  const {
    gameId,
    eventId,
    roundId,
    contestantId,
    basePoints,
    placementOrder,
    source = "auto",
    patternMatches = [],
    bonusDescriptors = [],
  } = payload;

  let runningTotal = await getLatestTotal(gameId, contestantId);
  const rows: Database["public"]["Tables"]["bingo_scores"]["Insert"][] = [];

  if (basePoints > 0) {
    runningTotal += basePoints;
    rows.push({
      event_id: eventId ?? gameId,
      game_id: gameId,
      round_id: roundId,
      contestant_id: contestantId,
      points_awarded: basePoints,
      total_after_round: runningTotal,
      award_order: placementOrder,
      metadata: {
        type: "placement",
        order: placementOrder,
        source,
      },
      is_bonus: false,
    });
  }

  const allBonuses: StrategyBonusDescriptor[] = [
    ...patternMatches.map((match) => ({
      type: "pattern" as const,
      id: match.id,
      label: match.label,
      points: match.points,
    })),
    ...bonusDescriptors,
  ];

  for (const bonus of allBonuses) {
    if (!bonus.points || bonus.points <= 0) continue;
    runningTotal += bonus.points;

    const metadata =
      bonus.type === "pattern"
        ? {
            type: "pattern",
            pattern: bonus.id,
            label: bonus.label,
            source,
          }
        : {
            type: "combo",
            combo: bonus.id,
            label: bonus.label,
            source,
          };

    rows.push({
      event_id: eventId ?? gameId,
      game_id: gameId,
      round_id: roundId,
      contestant_id: contestantId,
      points_awarded: bonus.points,
      total_after_round: runningTotal,
      award_order: null,
      metadata,
      is_bonus: true,
    });
  }

  if (!rows.length) {
    return [];
  }

  const { data, error } = await serverSupabase
    .from("bingo_scores")
    .insert(rows)
    .select("*");

  if (error) {
    throw error;
  }

  return data ?? [];
};
