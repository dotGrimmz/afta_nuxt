import type { SupabaseClient } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  role: "admin" | "user";
}

export const useProfile = () => {
  const supabase = useSupabaseClient();
  const profile = useState<Profile | null>("profile", () => null);
  const loading = useState<boolean>("profile-loading", () => false);

  const fetchProfile = async (id: string) => {
    if (profile.value) return profile.value; // don’t clobber
    loading.value = true;

    const { data, error } = await (supabase as SupabaseClient)
      .from("profiles")
      .select("id, email, username, role")
      .eq("id", id)
      .single();

    if (!error && data) {
      profile.value = data as Profile;
    } else {
      console.error("Profile fetch failed:", error?.message);
      profile.value = null;
    }
    loading.value = false;
  };

  // 1️⃣ Always fetch a verified user from Supabase Auth
  const init = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(); // ✅ verified call

    if (error) {
      console.error("Error getting user:", error.message);
      profile.value = null;
      return;
    }

    if (user?.id) {
      await fetchProfile(user.id);
    } else {
      profile.value = null;
    }
  };

  // Run on client ready
  //  @ts-ignore
  if (import.meta.client) {
    init();

    // 2️⃣ React to auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.id) {
        await fetchProfile(session.user.id);
      } else {
        profile.value = null;
      }
    });
  }

  const isAdmin = computed(() => profile.value?.role === "admin");
  const isUser = computed(() => profile.value?.role === "user");

  return { profile, isAdmin, isUser, loading };
};

// import type {
//   SupabaseClient,
//   AuthChangeEvent,
//   Session,
// } from "@supabase/supabase-js";

// export interface Profile {
//   id: string;
//   email: string | null;
//   username: string | null;
//   role: "admin" | "user";
// }

// export const useProfile = () => {
//   const supabase = useSupabaseClient();
//   const user = useSupabaseUser();
//   const profile = useState<Profile | null>("profile", () => null);
//   const loading = useState<boolean>("profile-loading", () => false);

//   //@ts-ignore
//   const clientReady = import.meta.client;

//   const fetchProfile = async (id: string) => {
//     if (profile.value) return profile.value; // ✅ don't clobber existing

//     loading.value = true;
//     const { data, error } = await (supabase as SupabaseClient)
//       .from("profiles")
//       .select("id, email, username, role")
//       .eq("id", id)
//       .single();

//     if (!error && data) {
//       profile.value = data as Profile;
//     } else {
//       console.error("Profile fetch failed:", error?.message);
//       profile.value = null;
//     }
//     loading.value = false;
//   };

//   // 1️⃣ Fetch profile if user already exists
//   if (clientReady && user.value?.id) {
//     fetchProfile(user.value.id);
//   }

//   // 2️⃣ React to user changes (covers login/logout)
//   watch(user, (newUser) => {
//     if (clientReady && newUser?.id) {
//       fetchProfile(newUser.id);
//     } else {
//       profile.value = null;
//     }
//   });

//   // 3️⃣ Refetch after login redirect
//   if (clientReady) {
//     supabase.auth.onAuthStateChange(
//       (_event: AuthChangeEvent, session: Session | null) => {
//         if (session?.user.id) {
//           fetchProfile(session.user.id);
//         }
//       }
//     );
//   }

//   const isAdmin = computed(() => profile.value?.role === "admin");
//   const isUser = computed(() => profile.value?.role === "user");

//   return { user, profile, isAdmin, isUser, loading };
// };
