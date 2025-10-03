import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const eventId = getRouterParam(event, "eventId");

  if (!eventId) {
    throw createError({ statusCode: 404, statusMessage: "no id!" });
  }
  const { error } = await client
    .from("bingo_events")
    .delete()
    .eq("id", eventId);

  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  return { success: true };
});
