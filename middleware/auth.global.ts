// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return;

  const user = useSupabaseUser();
  const { profile, loading } = useProfile();
  const { data } = await supabase.auth.getUser();
  console.log({ data });

  // 1️⃣ If navigating to dashboard while Supabase is still hydrating → wait
  if (to.path.startsWith("/dashboard") && user.value === null) {
    console.log("[auth] waiting for Supabase session...");
    return abortNavigation({
      statusCode: 401,
      statusMessage: "Auth not ready",
    });
  }

  // 2️⃣ If still loading profile → wait, but with timeout protection
  if (to.path.startsWith("/dashboard") && loading.value) {
    console.log("[auth] profile loading...");
    return; // don’t block forever
  }

  // 3️⃣ Redirect guests (no session at all)
  if (to.path.startsWith("/dashboard") && !user.value) {
    console.log("[auth] no user → redirecting to /login");
    return navigateTo("/login");
  }

  // 4️⃣ Enforce admin-only dashboard index
  if (to.path === "/dashboard") {
    if (!profile.value || profile.value.role !== "admin") {
      console.log("[auth] non-admin user redirected to /dashboard/games");
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
