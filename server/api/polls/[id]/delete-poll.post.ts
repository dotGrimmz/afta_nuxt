import { defineEventHandler, createError } from "h3";
import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  // Supabase client bound to the current request context
  const supabase = await serverSupabaseClient(event);
  const pollId = getRouterParam(event, "id");

  if (!pollId) {
    throw createError({ statusCode: 400, statusMessage: "Missing poll ID" });
  }

  await supabase.from("poll_results").delete().eq("poll_id", pollId);

  const { error } = await supabase.from("polls").delete().eq("id", pollId);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { success: true };
});
