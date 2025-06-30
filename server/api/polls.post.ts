// import { serverSupabaseClient } from "#supabase/server";
// import { readBody, defineEventHandler, createError } from "h3";
// import { PollSubmission } from "~/types/poll";

// export default defineEventHandler(async (event) => {
//   const supabase = await serverSupabaseClient(event);

//   const body = await readBody(event); // { question, options }

//   if (
//     !body.question ||
//     !Array.isArray(body.options) ||
//     body.options.length === 0
//   ) {
//     throw createError({ statusCode: 400, statusMessage: "Invalid poll data" });
//   }

//   const { data, error } = await supabase
//     .from("polls")
//     .insert({
//       question: body.question,
//       options: body.options,
//     } as any)
//     .select()
//     .single();

//   if (error) {
//     throw createError({ statusCode: 500, statusMessage: error.message });
//   }

//   console.log({ data });
//   return {
//     success: true,
//     poll: data,
//   };
// });

import { serverSupabaseClient } from "#supabase/server";
import { defineEventHandler, readBody, createError } from "h3";

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);

  /* ---------- runtime + TS validation ---------- */
  interface Body {
    question: string;
    options: string[];
  }

  const body = await readBody<Body>(event);

  if (
    !body?.question?.trim() ||
    !Array.isArray(body.options) ||
    body.options.length < 2 ||
    body.options.some((o) => typeof o !== "string" || !o.trim())
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid question or options",
    });
  }

  /* ---------- 1. insert poll ---------- */
  const { data: pollRow, error: pollErr } = await supabase
    .from("polls")
    .insert({ question: body.question.trim() } as any)
    .select("id")
    .single<{ id: string }>(); // <-- id is UUID string

  if (pollErr || !pollRow) {
    throw createError({
      statusCode: 500,
      statusMessage: pollErr?.message || "Poll insert failed",
    });
  }

  /* ---------- 2. insert options ---------- */
  const optionRows = body.options.map((txt, idx) => ({
    poll_id: pollRow.id,
    text: txt.trim(),
    sort: idx,
  }));

  const { error: optErr } = await supabase
    .from("poll_options")
    .insert(optionRows as any);
  if (optErr) {
    // Roll back the poll row if option insert fails
    await supabase.from("polls").delete().eq("id", pollRow.id);
    throw createError({ statusCode: 500, statusMessage: optErr.message });
  }

  /* ---------- success ---------- */
  event.node.res.statusCode = 201; // explicit “Created”
  return { id: pollRow.id };
});
