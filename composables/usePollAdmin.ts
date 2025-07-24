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
  const polls = ref<Poll[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const activePolls = ref<ActivePoll[]>([]);
  const inactivePolls = ref<InactivePoll[]>([]);
  const VOTE_STORAGE_KEY = "votedPolls";

  /**
   * Reset poll(s)
   *
   * takes a poll id or none at all.
   *
   * filters out the poll id from what is in local storage from the useVoteTracker hook
   *
   * we then make a db call
   *
   * will create a function that looks into local storage and finds what i need
   */

  const resetVotes = async (id: Poll["id"]) => {
    loading.value = true;
    error.value = null;

    try {
      await $fetch(`/api/polls/${id}/reset-votes`, {
        method: "POST",
      });
      console.log({ id });
      const votedPolls: VotedPoll[] = JSON.parse(
        localStorage.getItem(VOTE_STORAGE_KEY) || "[]"
      );
      console.log({ votedPolls });

      const filteredPolls = votedPolls.filter((poll) => poll.poll_id !== id);
      console.log({ filteredPolls });

      localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(filteredPolls));
    } catch (e: any) {
      error.value = e;
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
    resetVotes,
  };
};
