// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return;

  //@ts-ignore
  const clientReady = import.meta.client;
  if (!clientReady) {
    console.log("client failed");
  }

  const user = useSupabaseUser();
  const { profile, loading } = useProfile();
  console.log("process is on the client.", profile.value);
  // 1. If navigating into dashboard but user not yet known → wait
  if (to.path.startsWith("/dashboard") && user.value === null) {
    console.log("option 1", loading);
    return abortNavigation(); // ⏸ wait until Supabase hydrates
  }

  // 2. Redirect guests (confirmed no session) to login
  if (to.path.startsWith("/dashboard") && !user.value) {
    console.log("option 2");

    return navigateTo("/login");
  }

  // 3. Wait until profile is loaded
  if (to.path.startsWith("/dashboard") && !profile.value) {
    console.log("option 3");

    return abortNavigation();
  }

  // 4. Enforce admin-only dashboard index
  if (to.path === "/dashboard") {
    console.log("", profile.value?.role);
    if (profile.value?.role !== "admin" || !profile.value) {
      return navigateTo("/dashboard/games");
    }
  }
});

// export default defineNuxtRouteMiddleware(async (to) => {
//   if (process.server) return;

//   const user = useSupabaseUser();
//   if (!user.value) return navigateTo("/login");

//   if (to.path === "/dashboard") {
//     const supabase = useSupabaseClient();
//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("role")
//       .eq("id", user.value.id)
//       .single();

//       console.log
//     if (profile?.role !== "admin") {
//       return navigateTo("/dashboard/profile");
//     }
//   }
// });
