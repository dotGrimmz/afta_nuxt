const VOTE_STORAGE_KEY = "votedPolls";

export const useVoteTracker = (pollId: string) => {
  const hasVoted = computed(() => {
    if (typeof localStorage === "undefined") return false;

    const votedPolls = JSON.parse(
      localStorage.getItem(VOTE_STORAGE_KEY) || "[]"
    );
    return votedPolls.includes(pollId);
  });

  function markVoted() {
    if (typeof localStorage === "undefined") return;

    const votedPolls = JSON.parse(
      localStorage.getItem(VOTE_STORAGE_KEY) || "[]"
    );
    if (!votedPolls.includes(pollId)) {
      votedPolls.push(pollId);
      localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(votedPolls));
    }
  }

  return {
    hasVoted,
    markVoted,
  };
};
