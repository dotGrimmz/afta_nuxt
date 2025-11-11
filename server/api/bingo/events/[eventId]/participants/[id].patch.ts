import { serverSupabaseClient } from "#supabase/server";
import type { Database, TablesUpdate } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const id = getRouterParam(event, "id");
  const body = await readBody<TablesUpdate<"bingo_event_participants">>(event);

  if (!id) {
    throw createError({ statusCode: 404, statusMessage: "no event id!" });
  }

  const { data, error } = await client
    .from("bingo_event_participants")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  return data;
});
