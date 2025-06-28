import { defineEventHandler, createError } from "h3";
import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  // Supabase client bound to the current request context
  const supabase = await serverSupabaseClient(event);

  // Poll ID from the route param
  const { id } = event.context.params || {};

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing poll ID" });
  }

  // Delete the poll (and cascade-delete votes via FK)
  const { error } = await supabase.from("polls").delete().eq("id", id);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  // 204 No Content is a common REST response for successful delete
  event.node.res.statusCode = 204;
  return null;
});
