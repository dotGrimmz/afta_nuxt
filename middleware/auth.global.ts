// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return;
  const user = (await useSupabaseUser()).value;
  const protectedPaths = [/^\/host\//, /^\/play\//];
  if (protectedPaths.some((r) => r.test(to.path)) && !user) {
    return navigateTo("/login");
  }
});
