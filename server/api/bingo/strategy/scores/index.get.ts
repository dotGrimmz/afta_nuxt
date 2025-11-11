import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";
import type { StrategyLeaderboardEntry } from "~/types/bingo";

type ScoreRow = Database["public"]["Tables"]["bingo_scores"]["Row"];

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const eventId = typeof query.eventId === "string" ? query.eventId : undefined;
  const gameId = typeof query.gameId === "string" ? query.gameId : undefined;
  const limit =
    typeof query.limit === "string" && !Number.isNaN(Number(query.limit))
      ? Math.min(Math.max(Number(query.limit), 1), 500)
      : 200;

  if (!eventId && !gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "eventId or gameId is required",
    });
  }

  const client = await serverSupabaseClient<Database>(event);

  let request = client
    .from("bingo_scores")
    .select(
      `
      id,
      event_id,
      game_id,
      round_id,
      contestant_id,
      points_awarded,
      total_after_round,
      position,
      metadata,
      created_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (eventId) {
    request = request.eq("event_id", eventId);
  }

  if (gameId) {
    request = request.eq("game_id", gameId);
  }

  const { data, error } = await request;

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  const history = (data ?? []) as ScoreRow[];
  const contestantIds = Array.from(
    new Set(history.map((row) => row.contestant_id).filter(Boolean))
  ) as string[];

  const contestantLookup: Record<
    string,
    Pick<
      Database["public"]["Tables"]["bingo_contestants"]["Row"],
      "username" | "code" | "user_id"
    >
  > = {};

  if (contestantIds.length) {
    const { data: contestants, error: contestantsError } = await client
      .from("bingo_contestants")
      .select("id, username, code, user_id")
      .in("id", contestantIds);

    if (contestantsError) {
      throw createError({
        statusCode: 500,
        statusMessage: contestantsError.message,
      });
    }

    for (const contestant of contestants ?? []) {
      contestantLookup[contestant.id] = contestant;
    }
  }

  const leaderboardMap = new Map<string, StrategyLeaderboardEntry>();

  for (const row of history) {
    if (leaderboardMap.has(row.contestant_id)) continue;
    const contestant = contestantLookup[row.contestant_id ?? ""] ?? null;

    leaderboardMap.set(row.contestant_id, {
      contestantId: row.contestant_id,
      username: contestant?.username ?? null,
      code: contestant?.code ?? null,
      totalPoints: row.total_after_round,
      lastScoreId: row.id,
      lastRoundId: row.round_id,
      lastUpdate: row.created_at,
      position: row.position ?? null,
      metadata: row.metadata ?? {},
    });
  }

  return {
    history,
    leaderboard: Array.from(leaderboardMap.values()),
  };
});
