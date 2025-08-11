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
        <UButton
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :variant="isActive(link.to) ? 'soft' : 'ghost'"
          class="w-full justify-start"
          :icon="link.icon"
          :color="isActive(link.to) ? 'primary' : 'neutral'"
        >
          {{ link.label }}
        </UButton>
      </nav>
    </aside>

    <!-- Mobile slideover -->
    <!-- <USlideover
      v-model="open"
      side="left"
      overlay-class="!bg-black/60"
      content-class="!bg-white/5 !border-r !border-white/10 backdrop-blur"
      :overlay="true"
      class="md:hidden"
    >
      <div class="p-4 space-y-4">
        <nav class="space-y-1">
          <UButton
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            variant="solid"
            class="w-full justify-start"
            :icon="link.icon"
            :color="isActive(link.to) ? 'primary' : 'neutral'"
            @click="open = false"
          >
            {{ link.label }} -- test
          </UButton>
        </nav>
      </div>
    </USlideover> -->

    <!-- Main -->
    <div class="flex-1 min-w-0 flex flex-col">
      <header
        class="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-white/5 backdrop-blur"
      >
        <div class="flex items-center gap-3">
          <UButton
            class="inline-flex sm:hidden"
            variant="ghost"
            icon="i-heroicons-bars-3"
            @click="open = !open"
          />

          <h1 class="text-xl font-semibold">{{ pageTitle }}</h1>
        </div>
        <!-- right-side actions slot (optional) -->
        <slot name="actions" />
      </header>

      <main class="p-4">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
const route = useRoute();

const open = ref(false); // mobile USlideover

const links = [
  { label: "Dashboard", to: "/admin", icon: "i-heroicons-home" },
  {
    label: "Challenges",
    to: "/admin/challenges",
    icon: "i-heroicons-calendar-days",
  },
  { label: "Users", to: "/admin/users", icon: "i-heroicons-user-group" },
  { label: "Settings", to: "/admin/settings", icon: "i-heroicons-cog-6-tooth" },
];

const isActive = (to: string) => {
  return route.path.endsWith(to);
};

const pageTitle = computed(() => {
  if (route.meta?.title) return String(route.meta.title);
  const n = (route.name ?? "").toString();
  if (!n) return "Admin";
  return n
    .split("-")
    .map((s: any) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" - ");
});
</script>
