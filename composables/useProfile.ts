import type { SupabaseClient } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  role: "admin" | "user";
}

export const useProfile = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  const profile = useState<Profile | null>("profile", () => null);

  if (user.value && user.value.id) {
    useAsyncData(`profile-${user.value.id}`, async () => {
      const { data, error } = await (supabase as SupabaseClient)
        .from("profiles")
        .select("id, email, username, role")
        .eq("id", user.value!.id)
        .single();

      if (error) {
        console.error("Error loading profile:", error.message);
        return null;
      }
      profile.value = data as Profile;
      return data as Profile;
    });
  }

  const isAdmin = computed(() => profile.value?.role === "admin");
  const isUser = computed(() => profile.value?.role === "user");

  return { user, profile, isAdmin, isUser };
};
