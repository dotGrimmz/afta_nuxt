<script setup lang="ts">
import { ref } from "vue";
import type { SupabaseClient } from "@supabase/supabase-js";
import BaseModal from "~/components/ui/BaseModal.vue";

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const { profile } = useProfile();

const isOpen = defineModel<boolean>("modelValue"); // bound from parent
const localUsername = ref(profile.value?.username ?? "");
const saving = ref(false);
const errorMsg = ref("");

const emit = defineEmits(["saved"]);

const save = async (): Promise<void> => {
  if (!localUsername.value.trim()) {
    errorMsg.value = "Username cannot be empty";
    return;
  }

  saving.value = true;
  const { error } = await (supabase as SupabaseClient)
    .from("profiles")
    .update({ username: localUsername.value.trim() })
    .eq("id", user.value?.id);

  saving.value = false;

  if (error) {
    errorMsg.value = "Something went wrong, try again.";
  } else {
    profile.value = { ...profile.value!, username: localUsername.value.trim() };
    emit("saved", localUsername.value.trim());
    isOpen.value = false;
  }
};
</script>

<template>
  <BaseModal v-model="isOpen" title="Choose a Username" @close="isOpen = false">
    <input
      v-model="localUsername"
      type="text"
      class="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
      placeholder="Enter username"
    />

    <p v-if="errorMsg" class="text-red-400 text-sm mt-2">{{ errorMsg }}</p>

    <template #actions>
      <UButton :loading="saving" color="primary" @click="save">Save</UButton>
    </template>
  </BaseModal>
</template>
