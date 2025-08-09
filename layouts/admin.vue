<template>
  <div class="min-h-screen flex bg-gray-50">
    <!-- Sidebar (desktop) -->
    <aside class="max-md:hidden w-32 shrink-0 flex flex-col border-r bg-white">
      <nav class="px-2 space-y-1">
        <UButton
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          variant="ghost"
          class="w-full justify-start"
          :icon="link.icon"
          :color="isActive(link.to) ? 'primary' : 'neutral'"
        >
          {{ link.label }}
        </UButton>
      </nav>
    </aside>

    <!-- Mobile slideover (opened by default) -->
    <USlideover v-model="open" side="left" :overlay="true" class="md:hidden">
      <div class="p-4 space-y-4">
        <nav class="space-y-1">
          <UButton
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            variant="ghost"
            class="w-full justify-start"
            :icon="link.icon"
            :color="isActive(link.to) ? 'primary' : 'neutral'"
            @click="open = false"
          >
            {{ link.label }}
          </UButton>
        </nav>
      </div>
    </USlideover>

    <!-- Main -->
    <div class="flex-1 flex flex-col">
      <header
        class="h-16 flex items-center justify-between px-4 border-b bg-white"
      >
        <div class="flex items-center gap-3">
          <UButton
            class="md:hidden"
            variant="ghost"
            icon="i-heroicons-bars-3"
            @click="open = true"
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

// Left slider open on mobile by default
const open = ref(true);

// Nav links for admin
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

const isActive = (to: string) => route.path.endsWith(to);

const pageTitle = computed(() => {
  if (route.meta?.title) return String(route.meta.title);
  // fallback: derive from route name like 'admin-events' -> 'Admin Events'
  const n = (route.name ?? "").toString();
  if (!n) return "Admin";
  return n
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" - ");
});
</script>
