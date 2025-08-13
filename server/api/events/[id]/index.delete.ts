import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing event id" });
  }

  const supabase = await serverSupabaseClient<Database>(event);

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  // 204 No Content
  setResponseStatus(event, 204);
  return { success: true };
});
