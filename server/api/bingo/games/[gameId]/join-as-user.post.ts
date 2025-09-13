import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { Database } from "~/types/supabase";
import type { BingoContestantRow } from "~/types/bingo";
import { insertBingoCard } from "~/utils/bingo/insertCard";

// Reuse your existing code generator if you have it.
function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return `BINGO-${code}`;
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const user = await serverSupabaseUser(event); // null if not logged in
  const gameId = event.context.params?.gameId;

  if (!gameId)
    throw createError({ statusCode: 400, statusMessage: "Missing gameId" });
  if (!user)
    throw createError({ statusCode: 401, statusMessage: "Login required" });

  const body = await readBody<{
    username?: string;
    numCards?: number;
    freeSpace?: boolean;
    autoMark?: boolean;
  }>(event);
  const nCards = body?.numCards ?? 1;

  // 1) If already a contestant for this user+game, return existing (idempotent)
  const { data: existing } = await client
    .from("bingo_contestants")
    .select("*")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle<BingoContestantRow>();

  if (existing) {
    return { contestant: existing, code: existing.code, cards: [] };
  }

  // 2) Create a contestant row linked to this user
  const code = generateJoinCode();
  const { data: contestant, error: insErr } = await client
    .from("bingo_contestants")
    .insert({
      game_id: gameId,
      user_id: user.id, // <-- link to auth user
      username: body?.username ?? user.email ?? "Player",
      num_cards: nCards,
      code,
    })
    .select("*")
    .single();

  if (insErr || !contestant) {
    throw createError({
      statusCode: 500,
      statusMessage: insErr?.message ?? "Failed to create contestant",
    });
  }

  // 3) Optionally create cards here (or keep cards creation elsewhere)
  // If you already create cards on the client via an existing util, you can skip:
  // const cards: BingoCard[] = [];
  // for (let i = 0; i < nCards; i++) { ...insertBingoCard...; cards.push(card); }

  // 4️⃣ Generate cards
  const cards = [];
  for (let i = 0; i < nCards; i++) {
    const card = await insertBingoCard(
      event,
      gameId,
      contestant.id,
      body.freeSpace ?? false,
      body.autoMark ?? false
    );
    cards.push(card);
  }

  return { contestant, code, cards };
});
