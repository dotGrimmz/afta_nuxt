// server/api/polls/[id]/vote.post.ts
import { serverSupabaseClient } from "#supabase/server";
import { defineEventHandler, getRouterParam, readBody, createError } from "h3";

interface Body {
  option_id: string;
  voter_id: string;
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);
  const pollId = getRouterParam(event, "id");
  const body = await readBody<Body>(event);

  if (!pollId || !body?.option_id || !body?.voter_id) {
    throw createError({ statusCode: 400, statusMessage: "Missing fields" });
  }

  console.log(
    "option id:",
    body.option_id,
    "voter id:",
    body.voter_id,
    "poll id:",
    pollId
  );
  const { error } = await supabase.from("poll_votes").insert({
    poll_id: pollId,
    option_id: body.option_id,
    voter_id: body.voter_id,
  } as any);

  if (error) {
    // Duplicate vote? unique‑constraint returns 23505
    const dup = error.code === "23505";
    // if (dup) return { success: true }; // REMOVE TO ADD DUP SAFTEY
    throw createError({
      statusCode: dup ? 409 : 500,
      statusMessage: dup ? "Already voted" : error.message,
    });
  }

  return { success: true };
});
