<script setup lang="ts">
import { computed } from "vue";

type Profile = {
  id: string;
  username: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;
};

const { data, pending, error, refresh } = await useAsyncData(
  "dashboard-users",
  () => $fetch<Profile[]>("/api/users")
);

const users = computed(() => data.value ?? []);

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <UHeading size="lg">User Directory</UHeading>
    </div>

    <div v-if="pending" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <USkeleton v-for="n in 6" :key="n" class="h-32 rounded-xl" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      icon="i-heroicons-exclamation-triangle"
      title="Unable to load users"
      :description="error.message || 'Please try refreshing.'"
      class="max-w-xl"
    >
      <template #actions>
        <UButton
          color="error"
          variant="soft"
          icon="i-heroicons-arrow-path"
          @click="refresh()"
        >
          Retry
        </UButton>
      </template>
    </UAlert>

    <div v-else>
      <div v-if="!users.length" class="text-sm text-gray-400">
        No users found.
      </div>
      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <UCard v-for="user in users" :key="user.id">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-base font-semibold">
                  {{ user.username || "Unnamed User" }}
                </p>
                <p class="text-xs text-gray-400">
                  {{ user.email || "No email on file" }}
                </p>
              </div>
              <UBadge variant="soft" color="primary" v-if="user.role">
                {{ user.role }}
              </UBadge>
            </div>
          </template>

          <div class="space-y-2 text-sm text-gray-300">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-identification" class="text-gray-500" />
              <span class="truncate">{{ user.id }}</span>
            </div>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-calendar" class="text-gray-500" />
              <span>
                Joined
                {{
                  user.created_at
                    ? dateFormatter.format(new Date(user.created_at))
                    : "—"
                }}
              </span>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
