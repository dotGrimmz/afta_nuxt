import { defineEventHandler, readBody, getRouterParam } from "h3";
import { serverSupabaseClient } from "#supabase/server";
import type { Database, TablesUpdate } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing event id" });
  }

  const body = await readBody<{
    title?: string;
    description?: string | null;
    date?: string;
  }>(event);

  // Build a typed, partial payload
  const payload: TablesUpdate<"events"> = {};
  if (typeof body.title !== "undefined") payload.title = body.title;
  if (typeof body.description !== "undefined")
    payload.description = body.description;
  if (typeof body.date !== "undefined") payload.date = body.date;

  if (Object.keys(payload).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No fields to update",
    });
  }

  const supabase = await serverSupabaseClient<Database>(event);

  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return data;
});
