import type { Poll, PollOption } from "~/types/poll";

const VOTE_STORAGE_KEY = "votedPolls";

interface VotedPoll {
  poll_id: Poll["id"];
  option_id: PollOption["id"];
}
export const useVoteTracker = (pollId: number) => {
  const votedRef = ref(false);
  const selectedOptionId = ref<PollOption["id"] | null>(null);

  console.log("has voted:", toRaw(votedRef.value));

  // onMounted(() => {
  //   console.log("useVoteTracker Hook Mounting ID:", pollId);
  //   const votedPolls = JSON.parse(
  //     localStorage.getItem(VOTE_STORAGE_KEY) || "[]"
  //   );
  //   votedRef.value = votedPolls.includes(pollId);
  //   console.log("has voted on Mount:", toRaw(votedRef.value));
  // });

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

  // function markVoted() {
  //   const votedPolls = JSON.parse(
  //     localStorage.getItem(VOTE_STORAGE_KEY) || "[]"
  //   );

  //   if (!votedPolls.includes(pollId)) {
  //     votedPolls.push(pollId);
  //     localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(votedPolls));
  //     votedRef.value = true;
  //   }
  // }

  function markVoted(optionId: PollOption["id"]) {
    const votedPolls: VotedPoll[] = JSON.parse(
      localStorage.getItem(VOTE_STORAGE_KEY) || "[]"
    );

    // Remove any existing vote for this pollId
    const updatedVotes = votedPolls.filter((p) => p.poll_id !== pollId);

    updatedVotes.push({ poll_id: pollId, option_id: optionId });

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
