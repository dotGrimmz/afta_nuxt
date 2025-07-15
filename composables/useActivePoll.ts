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
 *
 */

export function useActivePoll(poll: Poll) {
  const supabase = useSupabaseClient();

  const options = ref<PollOptionWithVotes[]>([]);

  const isSubscribed = ref(false);
  const error = ref<string | null>(null);

  let channel: ReturnType<typeof supabase.channel> | null = null;

  // const fetchPoll = async () => {
  //   loading.value = true;

  //   try {
  //     const res = await $fetch<{ poll: Poll[] }>("/api/polls/active");

  //     if (!res?.poll?.length) {
  //       poll.value = null;
  //       options.value = [];
  //       return;
  //     }

  //     const foundPoll =
  //       res.poll.find((p) => p.id.toString() === pollId) ?? res.poll[0];

  //     if (foundPoll) {
  //       poll.value = foundPoll;

  //       // ✅ Normalize votes to flat numbers
  //       options.value = foundPoll.poll_options.map((opt) => ({
  //         ...opt,
  //         votes: opt.votes?.count ?? 0,
  //       }));

  //       setupRealtime();
  //     } else {
  //       poll.value = null;
  //       options.value = [];
  //     }
  //   } catch (err) {
  //     console.error("Failed to fetch poll:", err);
  //     poll.value = null;
  //     options.value = [];
  //     //@ts-ignore
  //     error.value = err?.message || "Something went wrong";
  //   } finally {
  //     loading.value = false;
  //   }
  // };

  // const refreshPoll = async () => {
  //   await fetchPoll();
  // };

  const setupOptions = () => {
    options.value = poll.poll_options.map((opt) => ({
      ...opt,
      votes: Array.isArray(opt.votes)
        ? opt.votes[0]?.count ?? 0
        : opt.votes ?? 0,
    }));
  };

  const setupRealtime = () => {
    if (!poll.id) {
      error.value = "No Poll to set up real Time";
      return;
    }

    if (channel) {
      supabase.removeChannel(channel);
    }

    channel = supabase
      .channel(`poll_votes_${poll.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "poll_votes",
          filter: `poll_id=eq.${poll.id}`,
        },
        (payload) => {
          const id = payload.new.option_id as string;
          const opt = options.value.find((o) => o.id === id);

          if (opt) {
            opt.votes += 1; // ✅ simplified because votes is now a number
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") isSubscribed.value = true;
      });
  };

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

  const unsubscribe = () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
      isSubscribed.value = false;
    }
  };

  watch(
    () => poll.is_active,
    (newStatus) => {
      if (newStatus) {
        setupRealtime();
      } else {
        unsubscribe();
      }
    },
    { immediate: true }
  );

  watch(() => poll.poll_options, setupOptions, { immediate: true, deep: true });

  onBeforeUnmount(() => {
    unsubscribe();
  });

  return {
    poll,
    options,
    error,
    isSubscribed,
    castVote,
  };
}
