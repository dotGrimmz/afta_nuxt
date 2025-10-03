<template>
  <div
    :class="[
      'w-full h-full rounded-card border p-5 shadow-sm',
      'bg-white/5 border-white/10 text-white',
      props.poll.is_active && 'ring-2 ring-primary/40 bg-primary/5',
    ]"
  >
    <!-- Question -->
    <h2 class="font-heading text-lg font-semibold text-white mb-2">
      {{ poll.question }}
    </h2>

    <!-- Options -->
    <ul class="space-y-1.5">
      <li
        v-for="option in poll.poll_options"
        :key="option.id"
        class="text-sm text-white/80"
      >
        • {{ option.text }} —
        <span class="text-white/70">{{ option.vote_count }}</span>
      </li>
    </ul>

    <!-- Actions -->
    <div class="mt-4 flex flex-wrap items-center gap-2">
      <!-- Activate -->
      <UButton
        v-if="!poll.is_active"
        :loading="pollLoading"
        :variant="'solid'"
        :color="'primary'"
        class="rounded-soft cursor-pointer"
        size="sm"
        @click="activatePoll"
      >
        Activate
      </UButton>

      <!-- Deactivate -->
      <UButton
        v-else
        :loading="pollLoading"
        :variant="'solid'"
        :color="'primary'"
        size="sm"
        class="rounded-soft cursor-pointer"
        @click="deActivatePoll"
      >
        Deactivate
      </UButton>

      <!-- Reset votes -->
      <UButton
        :loading="votesResetting"
        :variant="'solid'"
        :color="'secondary'"
        class="rounded-soft cursor-pointer"
        size="sm"
        @click="handleReset(poll.id)"
      >
        Reset Poll Votes
      </UButton>

      <!-- Delete -->
      <UButton
        :loading="pendingPollDeletion"
        :variant="'solid'"
        color="error"
        class="rounded-soft cursor-pointer"
        size="sm"
        @click="handelPollDeletion(poll.id)"
      >
        Delete Poll
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Poll } from "~/types/poll";
const { $toast } = useNuxtApp();
const pollLoading = ref(false);
const votesResetting = ref(false);
const pendingPollDeletion = ref(false);

const props = defineProps<{
  poll: Poll;
  resetVotes: (id: Poll["id"]) => void;
  loading: boolean;
  deletePoll: (id: Poll["id"]) => void;
}>();

const emit = defineEmits<{ (e: "poll-updated"): void }>();

const handelPollDeletion = async (id: Poll["id"]) => {
  pendingPollDeletion.value = true;
  try {
    props.deletePoll(id);
    emit("poll-updated");
    $toast.info("Poll Deleted!");
  } catch (e) {
    console.error(e);
  } finally {
    pendingPollDeletion.value = false;
  }
};

const handleReset = async (id: Poll["id"]) => {
  votesResetting.value = true;
  try {
    props.resetVotes(id);
    emit("poll-updated");
  } catch (e) {
    console.error(e);
  } finally {
    votesResetting.value = false;
  }
};

const activatePoll = async () => {
  if (props.poll.is_active) return;
  pollLoading.value = true;
  try {
    await $fetch(`/api/polls/${props.poll.id}/activate`, { method: "POST" });
    emit("poll-updated");
    $toast.success("Poll Activated!");
  } catch (err) {
    console.error("Failed to activate poll:", err);
    $toast.error("Failed to activate poll");
  } finally {
    pollLoading.value = false;
  }
};

const deActivatePoll = async () => {
  if (!props.poll.is_active) return;
  pollLoading.value = true;
  try {
    await $fetch(`/api/polls/${props.poll.id}/deactivate`, { method: "POST" });
    emit("poll-updated");
    $toast.success("Poll Deactivated!");
  } catch (err) {
    console.error("Failed to deactivate poll:", err);
    $toast.error("Failed to deactivate poll");
  } finally {
    pollLoading.value = false;
  }
};
</script>

<!-- No <style> needed; all Tailwind -->
