import { serverSupabaseClient } from "#supabase/server";
import { readBody, defineEventHandler, createError } from "h3";
import { PollSubmission } from "~/types/poll";

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);

  const body = await readBody(event); // { question, options }

  if (
    !body.question ||
    !Array.isArray(body.options) ||
    body.options.length === 0
  ) {
    throw createError({ statusCode: 400, statusMessage: "Invalid poll data" });
  }

  const { data, error } = await supabase
    .from("polls")
    .insert({
      question: body.question,
      options: body.options,
    } as any)
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  console.log({ data });
  return {
    success: true,
    poll: data,
  };
});
