<template>
  <div class="min-h-screen flex bg-[var(--bg)] text-white">
    <!-- Sidebar (desktop) -->
    <aside
      :class="[
        'w-36 shrink-0 flex-col border-r border-white/10 bg-white/5 backdrop-blur',
        open ? 'block md:flex' : 'hidden md:flex',
      ]"
    >
      <nav class="px-2 py-2 space-y-1">
        <!-- Loading skeleton -->
        <template v-if="loading">
          <div class="animate-pulse space-y-2">
            <div class="h-8 bg-gray-700 rounded"></div>
            <div class="h-8 bg-gray-700 rounded"></div>
          </div>
        </template>

        <!-- Admin links -->
        <template v-else-if="profile?.role === 'admin'">
          <UButton
            v-for="link in adminLinks"
            :key="link.to"
            :to="link.to"
            :variant="isActive(link.to) ? 'soft' : 'ghost'"
            class="w-full justify-start"
            :icon="link.icon"
            :color="isActive(link.to) ? 'primary' : 'neutral'"
          >
            {{ link.label }}
          </UButton>
        </template>

        <!-- User links -->
        <template v-else>
          <UButton
            v-for="link in userLinks"
            :key="link.to"
            :to="link.to"
            :variant="isActive(link.to) ? 'soft' : 'ghost'"
            class="w-full justify-start"
            :icon="link.icon"
            :color="isActive(link.to) ? 'primary' : 'neutral'"
          >
            {{ link.label }}
          </UButton>
        </template>
      </nav>
    </aside>

    <!-- Main -->
    <div class="flex-1 min-w-0 flex flex-col">
      <header
        class="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-white/5 backdrop-blur"
      >
        <!-- Left side: menu + page title -->
        <div class="flex items-center gap-3">
          <UButton
            class="inline-flex sm:hidden"
            variant="ghost"
            icon="i-heroicons-bars-3"
            @click="open = !open"
          />
          <h1 class="text-xl font-semibold">
            <span v-if="loading">...</span>
            <span v-else>
              <BlurText
                :text="pageTitle"
                :delay="200"
                class-name="text-xl font-semibold text-center"
                animate-by="words"
                direction="top"
                :threshold="0.1"
                root-margin="0px"
                :step-duration="0.35"
            /></span>
          </h1>
        </div>

        <!-- Right side: actions -->
        <div class="flex items-center gap-3">
          <slot name="actions" />
          <UButton class="cursor-pointer" variant="ghost" @click="signOut">
            Sign Out
          </UButton>
        </div>
      </header>

      <main class="p-4">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { SupabaseClient } from "@supabase/supabase-js";
import BlurText from "~/components/vue-bits/TextAnimations/BlurText/BlurText.vue";

const open = ref(false);
const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();

// ✅ new: no await here
const { profile, loading } = useProfile();

const signOut = async (): Promise<void> => {
  const { error } = await (supabase as SupabaseClient).auth.signOut();
  if (error) {
    console.error("Error signing out:", error.message);
  } else {
    router.push("/login");
  }
};

const adminLinks = [
  { label: "Dashboard", to: "/dashboard", icon: "i-heroicons-home" },
  {
    label: "Challenges",
    to: "/dashboard/challenges",
    icon: "i-heroicons-calendar-days",
  },
  { label: "Bingo", to: "/dashboard/bingo", icon: "i-heroicons-play" },
  { label: "Trivia", to: "/dashboard/trivia", icon: "i-heroicons-play" },

  { label: "Users", to: "/dashboard/users", icon: "i-heroicons-user-group" },
  {
    label: "Settings",
    to: "/dashboard/settings",
    icon: "i-heroicons-cog-6-tooth",
  },
  { label: "Profile", to: "/dashboard/profile", icon: "i-heroicons-user" },
];

const userLinks = [
  { label: "Bingo", to: "/dashboard/bingo", icon: "i-heroicons-play" },
  { label: "Profile", to: "/dashboard/profile", icon: "i-heroicons-user" },
];

const isActive = (to: string) => route.path.endsWith(to);

// ✅ clean loading state derived from profile

const pageTitle = computed((): string => {
  if (loading.value) {
    console.log(loading.value);
    return "..."; // skeleton
  }
  if (profile.value?.role === "admin") {
    return `Welcome Admin ${
      profile.value.username ? profile.value.username : ""
    }`;
  }
  if (profile.value?.role === "user" && profile.value.username) {
    return `Welcome ${profile.value.username}`;
  }
  return "Welcome";
});
</script>
