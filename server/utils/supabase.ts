import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase env vars on server");
}

export const serverSupabase = createClient(supabaseUrl, supabaseServiceKey);
