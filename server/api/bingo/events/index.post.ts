// server/api/bingo/events/index.post.ts
import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const body = await readBody(event);

  const { data, error } = await client
    .from("bingo_events")
    .insert([
      {
        name: body.name,
        flyer_url: body.flyer_url ?? null,
        payout: body.payout,
        min_cards: body.min_cards ?? 1,
        free_space_cost: body.free_space_cost ?? 0,
        auto_mark_cost: body.auto_mark_cost ?? 0,
        event_date: body.event_date,
        game_id: body.game_id ?? null,
      },
    ] as any)
    .select()
    .single();

  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  return data;
});
