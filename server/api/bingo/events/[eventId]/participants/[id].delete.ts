import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 404,
      statusMessage: "no event id!, might be deleted",
    });
  }

  const { error } = await client
    .from("bingo_event_participants")
    .delete()
    .eq("id", id);

  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  return { success: true };
});
