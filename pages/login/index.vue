<script setup lang="ts">
import { Auth } from "@supa-kit/auth-ui-vue";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import type {
  SupabaseClient,
  AuthChangeEvent,
  Session,
} from "@supabase/supabase-js";

const supabase = useSupabaseClient();
const router = useRouter();

const getRedirectTo = (): string | undefined => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/dashboard`;
  } else {
    return undefined;
  }
};

onMounted((): void => {
  const {
    data: { subscription },
  } = (supabase as SupabaseClient).auth.onAuthStateChange(
    (event: AuthChangeEvent, session: Session | null): void => {
      if (event === "SIGNED_IN" && session) {
        router.push("/dashboard"); // ✅ change to '/host' later if you want
      }
    }
  );

  onBeforeUnmount((): void => {
    if (subscription) {
      subscription.unsubscribe();
    }
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
