import { serverSupabaseClient } from "#supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StrategyBonusRules } from "~/types/bingo";
import type { Database } from "~/types/supabase";

const MAX_STRATEGY_DRAWS = 75;

const ensureStrategyRounds = async (
  client: SupabaseClient<Database>,
  gameId: string,
  totalRounds: number,
  drawConfig: { drawsPerRound: number; drawIntervalSeconds: number }
) => {
  const { data, error } = await client
    .from("bingo_rounds")
    .select("round_number")
    .eq("game_id", gameId);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  const existing = new Set((data ?? []).map((row) => row.round_number));
  const inserts: Database["public"]["Tables"]["bingo_rounds"]["Insert"][] = [];
  for (let i = 1; i <= totalRounds; i++) {
    if (existing.has(i)) continue;
    inserts.push({
      game_id: gameId,
      round_number: i,
      draws_per_round: drawConfig.drawsPerRound,
      draw_interval_seconds: drawConfig.drawIntervalSeconds,
      status: "pending",
    });
  }

  if (inserts.length) {
    const { error: insertError } = await client
      .from("bingo_rounds")
      .insert(inserts);
    if (insertError) {
      throw createError({
        statusCode: 500,
        statusMessage: insertError.message,
      });
    }
  }

  const { error: updateRoundsError } = await client
    .from("bingo_rounds")
    .update({ draws_per_round: drawConfig.drawsPerRound })
    .eq("game_id", gameId)
    .in("status", ["pending", "active", "cooldown"]);

  if (updateRoundsError) {
    throw createError({
      statusCode: 500,
      statusMessage: updateRoundsError.message,
    });
  }
};

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const gameId = event.context.params?.gameId;

  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing gameId in route",
    });
  }

  const body = await readBody<{
    firstPlacePoints?: number;
    secondPlacePoints?: number;
    thirdPlacePoints?: number;
    requiredWinners?: number;
    totalRounds?: number;
    drawLimitMode?: "unlimited" | "limited";
    drawLimitValue?: number;
    bonusRules?: StrategyBonusRules;
  }>(event);

  const { data: game, error } = await client
    .from("bingo_games")
    .select(
      "status, mode, strategy_draws_per_round, strategy_draw_interval_seconds, strategy_draw_limit_enabled, strategy_draw_limit"
    )
    .eq("id", gameId)
    .single();

  if (error || !game) {
    throw createError({
      statusCode: 404,
      statusMessage: error?.message ?? "Game not found",
    });
  }

  if (game.status !== "lobby") {
    throw createError({
      statusCode: 400,
      statusMessage: "Strategy settings can only be changed in the lobby.",
    });
  }

  if (game.mode !== "strategy") {
    throw createError({
      statusCode: 400,
      statusMessage: "Game must be in strategy mode to update strategy settings.",
    });
  }

  const updates: Database["public"]["Tables"]["bingo_games"]["Update"] = {};
  if (typeof body.firstPlacePoints === "number") {
    updates.strategy_first_place_points = body.firstPlacePoints;
  }
  if (typeof body.secondPlacePoints === "number") {
    updates.strategy_second_place_points = body.secondPlacePoints;
  }
  if (typeof body.thirdPlacePoints === "number") {
    updates.strategy_third_place_points = body.thirdPlacePoints;
  }
  if (typeof body.requiredWinners === "number") {
    updates.strategy_required_winners = body.requiredWinners;
  }
  if (typeof body.totalRounds === "number") {
    if (body.totalRounds < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: "Total rounds must be at least 1.",
      });
    }
    updates.total_rounds = body.totalRounds;
  }
  if (body.bonusRules && typeof body.bonusRules === "object") {
    updates.strategy_bonus_rules = body.bonusRules as Database["public"]["Tables"]["bingo_games"]["Update"]["strategy_bonus_rules"];
  }

  if (body.drawLimitMode) {
    const limitEnabled = body.drawLimitMode === "limited";
    if (limitEnabled) {
      if (typeof body.drawLimitValue !== "number") {
        throw createError({
          statusCode: 400,
          statusMessage: "Draw limit value is required when limiting draws.",
        });
      }
      const normalizedLimit = Math.max(
        30,
        Math.min(body.drawLimitValue, MAX_STRATEGY_DRAWS)
      );
      updates.strategy_draw_limit_enabled = true;
      updates.strategy_draw_limit = normalizedLimit;
      updates.strategy_draws_per_round = normalizedLimit;
    } else {
      updates.strategy_draw_limit_enabled = false;
      updates.strategy_draw_limit = null;
      updates.strategy_draws_per_round = MAX_STRATEGY_DRAWS;
    }
  } else if (typeof body.drawLimitValue === "number") {
    const normalizedLimit = Math.max(
      30,
      Math.min(body.drawLimitValue, MAX_STRATEGY_DRAWS)
    );
    updates.strategy_draw_limit_enabled = true;
    updates.strategy_draw_limit = normalizedLimit;
    updates.strategy_draws_per_round = normalizedLimit;
  }

  const { data: updatedGame, error: updateError } = await client
    .from("bingo_games")
    .update(updates)
    .eq("id", gameId)
    .select("*")
    .single();

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: updateError.message,
    });
  }

  const roundsChanged =
    typeof body.totalRounds === "number" ||
    body.drawLimitMode ||
    typeof body.drawLimitValue === "number";

  if (roundsChanged) {
    await ensureStrategyRounds(
      client,
      gameId,
      typeof body.totalRounds === "number"
        ? body.totalRounds
        : updatedGame.total_rounds ?? game.total_rounds,
      {
        drawsPerRound:
          updatedGame.strategy_draws_per_round ??
          game.strategy_draws_per_round ??
          MAX_STRATEGY_DRAWS,
        drawIntervalSeconds:
          updatedGame.strategy_draw_interval_seconds ??
          game.strategy_draw_interval_seconds ??
          5,
      }
    );
  }

  return { game: updatedGame };
});
