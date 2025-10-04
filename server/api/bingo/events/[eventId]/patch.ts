// server/api/bingo/events/[id].patch.ts
import { serverSupabaseClient } from "#supabase/server";
import type { Database, TablesUpdate } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const eventId = getRouterParam(event, "eventId");
  const body = await readBody<TablesUpdate<"bingo_events">>(event);

  if (!eventId) {
    throw createError({ statusCode: 404, statusMessage: "no id!" });
  }

  const { data, error } = await client
    .from("bingo_events")
    .update(body)
    .eq("id", eventId)
    .select()
    .single();

  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  return data;
});
