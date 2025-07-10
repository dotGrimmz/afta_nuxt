import { ref, onMounted, onBeforeUnmount } from "vue";
import { useSupabaseClient } from "#imports";
import type { PollResponse, PollOptionWithVotes } from "@/types/poll";

export function useActivePoll() {
  const supabase = useSupabaseClient();

  console.log("useActivePoll initialized");
  /* reactive state */
  const poll = ref<PollResponse["poll"] | null>(null);
  const options = ref<PollOptionWithVotes[]>([]);
  const loading = ref(true);

  let channel: ReturnType<typeof supabase.channel> | null = null;

  /* fetch active poll once */
  async function fetchPoll() {
    loading.value = true;
    try {
      const { data } = await $fetch<any>("/api/polls/active");
      console.log("Fetched active poll:", poll);

      if (data) {
        poll.value = data.poll;
        options.value = data.options;
        setupRealtime();
      }
    } finally {
      loading.value = false;
    }
  }

  /* realtime vote counts */
  function setupRealtime() {
    if (!poll.value) return;

    if (channel) supabase.removeChannel(channel); // cleanup if re‑fetched

    channel = supabase
      .channel(`poll_votes_${poll.value.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "poll_votes",
          filter: `poll_id=eq.${poll.value.id}`,
        },
        (payload) => {
          const id = payload.new.option_id as string;
          const opt = options.value.find((o) => o.id === id);
          if (opt) {
            if (opt.votes) opt.votes.count++;
            else opt.votes = { count: 1 };
          }
        }
      )
      .subscribe();
  }

  /* housekeeping */

  onMounted(() => {
    console.log("useActivePoll mounted");
    fetchPoll();
  });
  // onMounted(fetchPoll);
  onBeforeUnmount(() => {
    if (channel) supabase.removeChannel(channel);
  });

  return { poll, options, loading, fetchPoll };
}
