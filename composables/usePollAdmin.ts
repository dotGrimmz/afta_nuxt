// composables/usePollAdmin.ts
import { ref } from "vue";
import type { Poll, PollOption } from "@/types/poll";

type ActivePoll = Poll & { is_active: true };
type InactivePoll = Poll & { is_active: false };
interface VotedPoll {
  poll_id: Poll["id"];
  option_id: PollOption["id"];
}
export const usePollAdmin = () => {
  const { $toast } = useNuxtApp();

  const loading = ref(false);
  const error = ref<string | null>(null);
  const VOTE_STORAGE_KEY = "votedPolls";

  const resetVotes = async (id: Poll["id"]) => {
    loading.value = true;
    error.value = null;

    try {
      await $fetch(`/api/polls/${id}/reset-votes`, {
        method: "POST",
      });
      const votedPolls: VotedPoll[] = JSON.parse(
        localStorage.getItem(VOTE_STORAGE_KEY) || "[]"
      );

      const filteredPolls = votedPolls.filter((poll) => poll.poll_id !== id);

      localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(filteredPolls));
    } catch (e: any) {
      error.value = e;
    } finally {
      loading.value = false;
    }
  };

  const {
    data,
    error: pollErr,
    pending,
    refresh,
  } = useAsyncData("polls", () => $fetch<Poll[]>("/api/polls"), {
    server: true,
    default: () => [],
  });

  const pollErrorMsg = computed(() => pollErr.value?.message ?? null);
  const polls = computed<Poll[]>(() => data.value ?? []);

  const activePolls = computed<ActivePoll[]>(() =>
    polls.value.filter((p): p is ActivePoll => p.is_active === true)
  );

  const deletePoll = async (id: Poll["id"]) => {
    try {
      await $fetch(`/api/polls/${id}/delete-poll`, {
        method: "POST",
      });
      $toast.info("Poll Deleted");
    } catch (e: any) {
      console.error({ e });
      return e;
    }
  };

  return {
    polls,
    loading: pending,
    error: pollErrorMsg,

    refreshPolls: refresh,
    activePolls,
    resetVotes,
    deletePoll,
  };
};
