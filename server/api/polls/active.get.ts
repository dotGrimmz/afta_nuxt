// server/api/polls/active.get.ts
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
        sort,
        votes:poll_votes(count)
      )
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  // pick the first poll that has ≥ 2 options
  // const poll = (data || []).find((p) => p.poll_options?.length >= 2);

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: "No active poll with enough options",
    });
  }

  return { poll: data };
});
