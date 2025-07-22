const VOTE_STORAGE_KEY = "votedPolls";

export const useVoteTracker = (pollId: number) => {
  const votedRef = ref(false);
  console.log("has voted:", toRaw(votedRef.value));

  onMounted(() => {
    console.log("useVoteTracker Hook Mounting ID:", pollId);
    const votedPolls = JSON.parse(
      localStorage.getItem(VOTE_STORAGE_KEY) || "[]"
    );
    votedRef.value = votedPolls.includes(pollId);
    console.log("has voted on Mount:", toRaw(votedRef.value));
  });

  function markVoted() {
    const votedPolls = JSON.parse(
      localStorage.getItem(VOTE_STORAGE_KEY) || "[]"
    );

    if (!votedPolls.includes(pollId)) {
      votedPolls.push(pollId);
      localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(votedPolls));
      votedRef.value = true;
    }
  }

  return {
    hasVoted: votedRef,
    markVoted,
  };
};
