<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const { profile } = useProfile(); // 🔑 shared global profile

const username = ref("");
const saving = ref(false);
const message = ref("");

onMounted(async (): Promise<void> => {
  if (user.value) {
    const { data, error } = await (supabase as SupabaseClient)
      .from("profiles")
      .select("username")
      .eq("id", user.value.id)
      .single();

    if (!error && data) {
      //@ts-ignore
      profile.value = {
        ...profile.value,
        ...data,
        id: user.value.id, // Ensure id is always a string
      }; // 🔑 sync global profile
      username.value = data.username ?? "";
    }
  }
});

const saveUsername = async (): Promise<void> => {
  if (!username.value.trim()) {
    message.value = "Username cannot be empty";
    return;
  }

  saving.value = true;
  const { error } = await (supabase as SupabaseClient)
    .from("profiles")
    .update({ username: username.value.trim() })
    .eq("id", user.value?.id);

  if (error) {
    console.error("Error saving username:", error.message);
    message.value = "Something went wrong, try again.";
  } else {
    profile.value = { ...profile.value!, username: username.value.trim() };
    message.value = "Profile updated!";
  }
  saving.value = false;
};
</script>

<template>
  <main class="max-w-xl mx-auto p-6 space-y-6">
    <h1 class="text-2xl font-bold">Your Profile</h1>

    <div class="bg-gray-800 p-4 rounded space-y-4">
      <label class="block">
        <span class="text-sm text-gray-300">Username</span>
        <input
          v-model="username"
          type="text"
          class="w-full mt-1 p-2 rounded bg-gray-900 border border-gray-600 text-white"
          placeholder="Enter your username"
        />
      </label>

      <UButton
        :loading="saving"
        :disabled="!username.trim()"
        color="primary"
        class="w-full cursor-pointer"
        @click="saveUsername"
      >
        Save
      </UButton>

      <p v-if="message" class="text-sm mt-2">{{ message }}</p>
    </div>
  </main>
</template>
