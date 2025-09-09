// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  // ✅ Only run client-side (supabase user doesn’t exist on server)
  if (process.server) return;

  const user = useSupabaseUser();
  const { profile, loading } = useProfile();

  // 1️⃣ Still waiting for Supabase/user to hydrate
  if (to.path.startsWith("/dashboard") && user.value === null) {
    console.log("[auth] waiting for Supabase session...");
    return abortNavigation();
  }

  // 2️⃣ Redirect guests (confirmed no user) to login
  if (to.path.startsWith("/dashboard") && !user.value) {
    console.log("[auth] no user → redirecting");
    return navigateTo("/login");
  }

  // 3️⃣ Wait until profile has loaded from DB
  if (to.path.startsWith("/dashboard") && loading.value) {
    console.log("[auth] profile loading...");
    return abortNavigation();
  }

  // 4️⃣ Enforce admin-only for `/dashboard` root
  if (to.path === "/dashboard") {
    console.log("[auth] dashboard index check:", profile.value?.role);
    if (!profile.value || profile.value.role !== "admin") {
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
