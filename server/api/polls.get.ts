import { serverSupabaseClient } from "#supabase/server";
import { defineEventHandler, createError } from "h3";

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);
  const { data, error } = await supabase.rpc("get_grouped_polls");

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return data;
});
