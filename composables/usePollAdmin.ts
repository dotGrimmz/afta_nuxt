// composables/usePollAdmin.ts
import { ref } from "vue";
import type { Poll } from "@/types/poll";

type ActivePoll = Poll & { is_active: true };
type InactivePoll = Poll & { is_active: false };

export const usePollAdmin = () => {
  const polls = ref<Poll[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const activePolls = ref<ActivePoll[]>([]);
  const inactivePolls = ref<InactivePoll[]>([]);

  const fetchPolls = async () => {
    loading.value = true;
    try {
      const res = await $fetch<Poll[]>("/api/polls");
      const arr = res.reduce(
        (
          acc: { activePolls: ActivePoll[]; inactivePolls: InactivePoll[] },
          current: Poll
        ) => {
          if (current.is_active) {
            acc.activePolls.push(current as ActivePoll);
          }
          acc.inactivePolls.push(current as InactivePoll);
          return acc;
        },
        {
          inactivePolls: [],
          activePolls: [],
        }
      );
      polls.value = res;
      inactivePolls.value = arr.inactivePolls;
      activePolls.value = arr.activePolls;
    } catch (err: any) {
      error.value = err?.message ?? "Failed to fetch polls.";
    } finally {
      loading.value = false;
    }
  };
  onMounted(() => {
    fetchPolls();
  });

  // ✅ Toggle a poll’s active status using your existing /api/polls/[id]/activate

  const refreshPolls = async () => {
    await fetchPolls();
  };

  return {
    polls,
    loading,
    error,
    fetchPolls,
    refreshPolls,
    activePolls,
  };
};
