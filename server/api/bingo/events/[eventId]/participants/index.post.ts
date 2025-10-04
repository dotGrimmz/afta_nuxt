import { serverSupabaseClient } from "#supabase/server";
import type { Database, TablesInsert } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const body = await readBody<TablesInsert<"bingo_event_participants">>(event);

  const { data, error } = await client
    .from("bingo_event_participants")
    .insert(body)
    .select()
    .single();

  if (error)
    throw createError({ statusCode: 400, statusMessage: error.message });
  return data;
});
