// server/api/polls/[id]/activate.post.ts
import { serverSupabaseClient } from "#supabase/server";
import { defineEventHandler, getRouterParam, createError } from "h3";

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);
  const pollId = getRouterParam(event, "id");

  if (!pollId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Poll ID is required",
    });
  }

  const { error } = await supabase
    .from("polls")
    //@ts-ignore
    .update({ is_active: true }) // Cast to any to avoid type issues
    .eq("id", pollId);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { success: true };
});
