// middleware/auth.global.ts

interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  role: "admin" | "user";
}
export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return;

  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  console.log("super user", user.value);
  if (!to.path.startsWith("/dashboard")) return; // only guard dashboard

  // 🔑 Check authenticated user
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    if (to.path !== "/login") {
      console.log("[auth] no user → redirecting to /login");
      return navigateTo("/login");
    }
    return;
  }

  // ✅ Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, username, role")
    .eq("id", data.user.id)
    .single<Profile>();

  // 🚨 Fallback if no profile
  if (!profile) {
    if (to.path !== "/dashboard/profile") {
      console.log("[auth] no profile → redirecting to /dashboard/profile");
      return navigateTo("/dashboard/profile");
    }
    return;
  }

  // 🛡️ Enforce role-based access
  if (profile.role === "admin") {
    // Admins should land on `/dashboard`
    if (to.path === "/dashboard/profile") {
      console.log("[auth] admin detected → redirect to /dashboard");
      return navigateTo("/dashboard");
    }
  } else {
    // Regular users should land on `/dashboard/profile`
    if (to.path === "/dashboard") {
      console.log("[auth] user detected → redirect to /dashboard/profile");
      return navigateTo("/dashboard/profile");
    }
  }
});
