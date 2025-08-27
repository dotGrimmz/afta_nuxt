// composables/useProfile.ts
import type {
  SupabaseClient,
  AuthChangeEvent,
  Session,
} from "@supabase/supabase-js";

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
  //@ts-ignore
  const clientReady = import.meta.client;

  const fetchProfile = async (id: string) => {
    const { data, error } = await (supabase as SupabaseClient)
      .from("profiles")
      .select("id, email, username, role")
      .eq("id", id)
      .single();

    if (!error && data) {
      profile.value = data as Profile;
    } else {
      console.error("Profile fetch failed:", error?.message);
    }
  };

  // 1️⃣ Fetch when user already exists
  if (clientReady && user.value?.id) {
    fetchProfile(user.value.id);
  }

  // 2️⃣ Refetch after login redirect
  if (clientReady) {
    supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user.id) {
          fetchProfile(session.user.id);
        }
      }
    );
  }

  const isAdmin = computed(() => profile.value?.role === "admin");
  const isUser = computed(() => profile.value?.role === "user");

  return { user, profile, isAdmin, isUser };
};
