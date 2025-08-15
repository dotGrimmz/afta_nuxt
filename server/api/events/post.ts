import { serverSupabaseClient } from "#supabase/server";
import { defineEventHandler, readBody } from "h3";
import type { Database, TablesInsert } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    title?: string;
    description?: string | null;
    date?: string;
  }>(event);

  if (!body?.title || !body?.date) {
    throw createError({
      statusCode: 400,
      statusMessage: "Title and date are required",
    });
  }

  const client = await serverSupabaseClient<Database>(event);

  const payload: TablesInsert<"events"> = {
    title: body.title,
    description: body.description ?? null,
    date: body.date,
  };

  const { data, error } = await client
    .from("events")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return data;
});
