import type { SupabaseClient } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  role: "admin" | "user";
}

export const useProfile = async () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const profile = useState<Profile | null>("profile", () => null);

  if (user.value && !profile.value) {
    const { data, error } = await (supabase as SupabaseClient)
      .from("profiles")
      .select("id, email, username, role")
      .eq("id", user.value.id)
      .single();

    if (!error && data) {
      profile.value = data as Profile;
    }
  }

  const isAdmin = computed((): boolean => profile.value?.role === "admin");
  const isUser = computed((): boolean => profile.value?.role === "user");

  return { user, profile, isAdmin, isUser };
};
