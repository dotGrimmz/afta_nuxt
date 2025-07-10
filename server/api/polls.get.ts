import { serverSupabaseClient } from "#supabase/server";
import { defineEventHandler, createError } from "h3";

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);

  const { data, error } = await supabase
    .from("polls")
    .select(
      `
    id,
    question,
    is_active,
    created_at,
    poll_options (
      id,
      text,
      poll_votes(count)
    )
  `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  console.log({ data });
  return data;
});
