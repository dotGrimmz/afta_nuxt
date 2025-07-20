// server/api/polls/[id]/activate.post.ts
import { serverSupabaseClient } from "#supabase/server";
import { defineEventHandler, getRouterParam, createError, readBody } from "h3";
import type { Database } from "~/types/supabase"; // adjust path as needed

export default defineEventHandler(async (event) => {
  console.log("event: ", event);
  const supabase = await serverSupabaseClient<Database>(event); // Typed client
  const pollId = getRouterParam(event, "id");

  console.log("Activating poll with ID:", pollId);
  if (!pollId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Poll ID and is_active boolean are required",
    });
  }

  const { data, error } = await supabase
    .from("polls")
    .update({ is_active: true })
    .eq("id", pollId)
    .select();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { success: true, updatedPoll: data };
});
