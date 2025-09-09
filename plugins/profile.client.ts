import type { Profile } from "~/composables/useProfile";

export default defineNuxtPlugin((nuxtApp) => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const profile = useState<Profile | null>("profile", () => null);
  const loading = useState("profile-loading", () => false);

  const fetchProfile = async (id: string) => {
    if (!id) return;
    loading.value = true;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, username, role")
      .eq("id", id)
      .single();

    profile.value = error ? null : (data as Profile);
    loading.value = false;
  };

  // Initial fetch if user exists
  watchEffect(() => {
    if (user.value?.id) {
      fetchProfile(user.value.id);
    } else {
      profile.value = null;
    }
  });

  // Supabase auth state listener
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user?.id) {
      fetchProfile(session.user.id);
    } else {
      profile.value = null;
    }
  });
});
