// server/api/bingo/events/[id].get.ts
import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const eventId = getRouterParam(event, "eventId");

  if (!eventId) {
    throw createError({ statusCode: 404, statusMessage: "no id!" });
  }

  const { data, error } = await client
    .from("bingo_events")
    .select("*, bingo_event_participants(*)")
    .eq("id", eventId)
    .single();

  if (error)
    throw createError({ statusCode: 404, statusMessage: error.message });
  return data;
});
