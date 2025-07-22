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

  const {
    error,
    pending: loading,
    execute,
    status,
  } = useFetch(() => `/api/polls/${pollID}/vote`, {
    method: "POST",
    body: () => ({
      option_id: optionId.value,
      voter_id: voterId,
    }),
    immediate: false,
  });

  const castVote = async (newOptionId: PollOption["id"]) => {
    optionId.value = newOptionId;

    console.log("option ID:", optionId, "PollId", pollID);
    await execute();
  };

  return {
    castVote,
    loading,
    error,
    status,
  };
}
