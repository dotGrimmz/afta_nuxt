<script setup lang="ts">
import { Auth } from "@supa-kit/auth-ui-vue";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import type {
  SupabaseClient,
  AuthChangeEvent,
  Session,
} from "@supabase/supabase-js";
import type { Database } from "~/types/supabase";

const supabase = useSupabaseClient<Database>();
const router = useRouter();

const getRedirectTo = (): string | undefined => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/dashboard`;
  }
};

onMounted((): void => {
  const {
    data: { subscription },
  } = (supabase as SupabaseClient).auth.onAuthStateChange(
    async (event: AuthChangeEvent, session: Session | null): Promise<void> => {
      if (event === "SIGNED_IN" && session) {
        // fetch profile to check role
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile after login:", error.message);
          router.push("/dashboard/login"); // safe fallback
          return;
        }

        if (profile?.role === "admin") {
          router.push("/dashboard");
        } else {
          router.push("/dashboard/games");
        }
      }
    }
  );

  onBeforeUnmount((): void => {
    if (subscription) subscription.unsubscribe();
  });
});
</script>

<template>
  <main
    class="min-h-screen flex sm:items-center justify-center p-6 bg-gray-900"
  >
    <div
      class="w-full h-[fit-content] max-w-md rounded-2xl bg-gray-800 p-6 shadow text-white"
    >
      <h1 class="text-2xl font-bold mb-4 text-center">Sign in</h1>

      <Auth
        :supabase-client="supabase"
        :appearance="{
          brand: 'black',
          theme: ThemeSupa,
          variables: { default: { colors: { brand: '#3b82f6' } } },
        }"
        :providers="(['google'] as const)"
        :redirect-to="getRedirectTo()"
      />
    </div>
  </main>
</template>
