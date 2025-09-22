import { serverSupabaseClient } from "#supabase/server";
import { createError, defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, email, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data ?? [];
});
