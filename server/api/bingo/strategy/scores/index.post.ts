import { serverSupabaseClient } from "#supabase/server";
import type { Database, Json } from "~/types/supabase";

type StrategyScorePayload = {
  eventId: string;
  contestantId: string;
  pointsAwarded: number;
  gameId?: string | null;
  roundId?: string | null;
  position?: number | null;
  metadata?: Json;
};

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const body = await readBody<StrategyScorePayload>(event);

  if (
    !body?.eventId ||
    !body?.contestantId ||
    typeof body.pointsAwarded !== "number"
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "eventId, contestantId and pointsAwarded are required",
    });
  }

  const { data: latest, error: latestError } = await client
    .from("bingo_scores")
    .select("total_after_round")
    .eq("event_id", body.eventId)
    .eq("contestant_id", body.contestantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    throw createError({
      statusCode: 500,
      statusMessage: latestError.message,
    });
  }

  const totalAfter =
    (latest?.total_after_round ?? 0) + Number(body.pointsAwarded);

  const { data: score, error: insertError } = await client
    .from("bingo_scores")
    .insert({
      event_id: body.eventId,
      game_id: body.gameId ?? null,
      round_id: body.roundId ?? null,
      contestant_id: body.contestantId,
      points_awarded: body.pointsAwarded,
      total_after_round: totalAfter,
      position: body.position ?? null,
      metadata:
        body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    })
    .select("*")
    .single();

  if (insertError || !score) {
    throw createError({
      statusCode: 500,
      statusMessage: insertError?.message ?? "Failed to store score",
    });
  }

  return { score };
});
