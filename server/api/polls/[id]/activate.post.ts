// server/api/polls/[id]/activate.post.ts
import { serverSupabaseClient } from "#supabase/server";
import { defineEventHandler, getRouterParam, createError } from "h3";
import type { Database } from "~/types/supabase"; // adjust path as needed

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event); // Typed client
  const pollId = getRouterParam(event, "id");

  console.log("Activating poll with ID:", pollId);
  if (!pollId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Poll ID is required",
    });
  }

  // Use the Update type for polls table here for proper typing
  // instead of setting to true I want to toggle the is_active field
  // If you want to toggle, you can fetch the current state first
  const { data: currentPoll, error: fetchError } = await supabase
    .from("polls")
    .select("is_active")
    .eq("id", pollId)
    .single();

  if (fetchError) {
    throw createError({ statusCode: 500, statusMessage: fetchError.message });
  }

  console.log("Current is_active status:", currentPoll?.is_active);

  // then toggle the is_active field
  const newStatus = !(currentPoll?.is_active ?? false);

  // Update the poll to toggle is_active
  const { data, error } = await supabase
    .from("polls")
    .update({
      is_active: newStatus,
    } as Database["public"]["Tables"]["polls"]["Update"])
    .eq("id", pollId)
    .select();
  // .eq("id", pollId) // Use pollId if you want to activate a specific poll

  console.log("Update result:", data, error);
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { success: true, updatedPoll: data };
});
