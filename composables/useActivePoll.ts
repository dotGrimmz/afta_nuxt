import { ref } from "vue";
import type { Poll, PollOption } from "@/types/poll";
import { useDeviceId } from "~/composables/useDeviceId";

/**
 *
 * this now needs to take a poll id always
 * this will now manage each individual active poll
 * will only be used in active poll tile
 *
 * actions
 * vote on a poll
 * handles refresh
 *
 *
 *
 */

export function useActivePoll(pollID: Poll["id"]) {
  const voterId = useDeviceId();

  const optionId = ref<string | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<any>(null);
  const selectedVoteId = ref<string | null>(null);

  const execute = async () => {
    loading.value = true;
    error.value = null;

    try {
      await $fetch(`/api/polls/${pollID}/vote`, {
        method: "POST",
        body: {
          option_id: optionId.value,
          voter_id: voterId,
        },
      });

      selectedVoteId.value = optionId.value;
    } catch (e: any) {
      error.value = e;
    } finally {
      loading.value = false;
    }
  };
  const castVote = async (newOptionId: PollOption["id"]) => {
    optionId.value = newOptionId;
    await execute();
  };

  return {
    castVote,
    loading,
    error,
    selectedVoteId: selectedVoteId.value,
  };
}
