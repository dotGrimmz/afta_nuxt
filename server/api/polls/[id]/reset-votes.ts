// server/api/polls/[id]/activate.post.ts
import { serverSupabaseClient } from "#supabase/server";
import { defineEventHandler, getRouterParam, createError } from "h3";
import type { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event);
  const pollId = getRouterParam(event, "id");

  console.log("Resetting votes for poll with ID:", pollId);
  if (!pollId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Poll ID is required",
    });
  }

  const { error, data } = await supabase
    .from("poll_votes")
    .delete()
    .eq("poll_id", pollId);
  console.log({ data });

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { success: true };
});
