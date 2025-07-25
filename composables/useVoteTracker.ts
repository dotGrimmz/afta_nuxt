import type { Poll, PollOption } from "~/types/poll";

const VOTE_STORAGE_KEY = "votedPolls";

interface VotedPoll {
  poll_id: Poll["id"];
  option_id: PollOption["id"];
  device_id?: string;
}
export const useVoteTracker = (pollId: Poll["id"]) => {
  const votedRef = ref(false);
  const selectedOptionId = ref<PollOption["id"] | null>(null);
  const { $deviceId: deviceId } = useNuxtApp();

  console.log("has voted:", toRaw(votedRef.value));

  onMounted(() => {
    const votedPolls: VotedPoll[] = JSON.parse(
      localStorage.getItem(VOTE_STORAGE_KEY) || "[]"
    );

    const match = votedPolls.find((p) => p.poll_id === pollId);
    if (match) {
      votedRef.value = true;
      selectedOptionId.value = match.option_id;
    }
  });

  function markVoted(optionId: PollOption["id"]) {
    const votedPolls: VotedPoll[] = JSON.parse(
      localStorage.getItem(VOTE_STORAGE_KEY) || "[]"
    );

    // Remove any existing vote for this pollId
    const updatedVotes = votedPolls.filter((p) => p.poll_id !== pollId);

    updatedVotes.push({
      poll_id: pollId,
      option_id: optionId,
      device_id: deviceId,
    });

    localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(updatedVotes));
    votedRef.value = true;
    selectedOptionId.value = optionId;
  }

  return {
    hasVoted: votedRef,
    markVoted,
    selectedOptionId,
  };
};
