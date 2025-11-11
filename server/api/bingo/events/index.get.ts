// server/api/bingo/events/index.get.ts
import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const { data, error } = await client
    .from("bingo_events")
    .select("*")
    .order("event_date", { ascending: true });

  if (error)
    throw createError({ statusCode: 500, statusMessage: error.message });
  return data;
});
