// composables/usePollAdmin.ts
import { ref } from "vue";
import type { Poll, PollOption } from "@/types/poll";
const { $toast } = useNuxtApp();

type ActivePoll = Poll & { is_active: true };
type InactivePoll = Poll & { is_active: false };
interface VotedPoll {
  poll_id: Poll["id"];
  option_id: PollOption["id"];
}
export const usePollAdmin = () => {
  const polls = ref<Poll[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const activePolls = ref<ActivePoll[]>([]);
  const inactivePolls = ref<InactivePoll[]>([]);
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
      $toast.success("Votes reset!");
    } catch (e: any) {
      error.value = e;
      $toast.success("Votes did not!");
    } finally {
      loading.value = false;
    }
  };

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
    resetVotes,
  };
};
