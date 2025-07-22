import { ref, onMounted, onBeforeUnmount } from "vue";
import { useSupabaseClient } from "#imports";
import type { Poll, PollOptionWithVotes } from "@/types/poll";
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

export function useActivePoll(poll: Poll) {
  const supabase = useSupabaseClient();

  const error = ref<string | null>(null);

  const castVote = async ({
    pollId,
    optionId,
  }: {
    pollId: number;
    optionId: string;
  }) => {
    try {
      await $fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        body: {
          option_id: optionId,
          voter_id: useDeviceId(), // local‑storage UUID
        },
      });
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  // const unsubscribe = () => {
  //   if (channel) {
  //     supabase.removeChannel(channel);
  //     channel = null;
  //     isSubscribed.value = false;
  //   }
  // };

  // watch(
  //   () => poll.is_active,
  //   (newStatus) => {
  //     if (newStatus) {
  //       setupRealtime();
  //     } else {
  //       unsubscribe();
  //     }
  //   },
  //   { immediate: true }
  // );

  // watch(() => poll.poll_options, setupOptions, { immediate: true, deep: true });

  // onBeforeUnmount(() => {
  //   unsubscribe();
  // });

  return {
    poll,
    options,
    error,
    isSubscribed,
    castVote,
  };
}
