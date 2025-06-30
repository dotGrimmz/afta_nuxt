// server/api/polls/active.get.ts
import { serverSupabaseClient } from "#supabase/server";
import { defineEventHandler, createError } from "h3";

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);

  /** 1. fetch the active poll */
  const { data: poll, error: pollErr } = await supabase
    .from("polls")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false }) // in case you ever have >1
    .limit(1)
    .single();

  if (pollErr || !poll) {
    throw createError({ statusCode: 404, statusMessage: "No active poll" });
  }

  /** 2. fetch its options & vote counts */
  const { data: options, error: optErr } = await supabase
    .from("poll_options")
    .select(
      `
      id,
      text,
      sort,
      votes:poll_votes(count)
    `
    )
    //@ts-ignore
    .eq("poll_id", poll.id)
    .order("sort");

  if (optErr) {
    throw createError({ statusCode: 500, statusMessage: optErr.message });
  }

  return { poll, options };
});
